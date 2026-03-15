import type { User } from "@supabase/supabase-js";

import {
  getFollowerCount,
  getFilmLikeCounts,
  getViewerFollowingCreator,
  getViewerLikedFilmIds,
} from "@/lib/services/engagement";
import { getFilmCommentCounts } from "@/lib/services/comments";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  FoundingCreatorInfo,
  Profile,
  PublicCreatorListItem,
  PublicCreatorProfileData,
  PublicFilmCard,
} from "@/types";

function normalizeHandleCandidate(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function buildHandleFromUser(user: Pick<User, "id" | "email" | "user_metadata">) {
  const emailBase = user.email?.split("@")[0] ?? "creator";
  const metadataName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : "";
  const base = normalizeHandleCandidate(metadataName || emailBase) || "creator";

  return base.slice(0, 24);
}

function buildDisplayNameFromUser(user: Pick<User, "email" | "user_metadata">) {
  return (
    (typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim()) ||
    user.email?.split("@")[0] ||
    "Creator"
  );
}

function buildProfileInsertPayload(user: Pick<User, "id" | "email" | "user_metadata">, handle: string) {
  return {
    id: user.id,
    handle,
    display_name: buildDisplayNameFromUser(user),
    is_creator: false,
  };
}

function mapFoundingCreator(row: Record<string, unknown>): FoundingCreatorInfo {
  return {
    isFoundingCreator: Boolean(row.is_founding_creator),
    founderNumber:
      typeof row.founding_creator_number === "number" ? row.founding_creator_number : null,
    awardedAt:
      typeof row.founding_creator_awarded_at === "string" ? row.founding_creator_awarded_at : null,
    featured: row.founding_creator_featured !== false,
    notes: typeof row.founding_creator_notes === "string" ? row.founding_creator_notes : null,
    invitedAt:
      typeof row.founding_creator_invited_at === "string" ? row.founding_creator_invited_at : null,
    acceptedAt:
      typeof row.founding_creator_accepted_at === "string" ? row.founding_creator_accepted_at : null,
  };
}

async function makeUniqueHandle(
  seed: string,
  userId: string,
  currentHandle?: string | null,
) {
  const serviceRoleSupabase = createServiceRoleSupabaseClient();
  const supabase = serviceRoleSupabase ?? await createServerSupabaseClient();

  if (!supabase) {
    return seed;
  }

  let candidate = seed || "creator";
  let suffix = 0;

  while (true) {
    const { data } = await supabase
      .from("profiles")
      .select("id, handle")
      .eq("handle", candidate)
      .maybeSingle();

    if (!data || data.id === userId || data.handle === currentHandle) {
      return candidate;
    }

    suffix += 1;
    candidate = `${seed.slice(0, Math.max(3, 24 - String(suffix).length - 1))}_${suffix}`;
  }
}

export function isValidHandle(handle: string) {
  return /^[a-z0-9_]{3,32}$/.test(handle);
}

export async function ensureProfileForUser(user: User): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  const serviceRoleSupabase = createServiceRoleSupabaseClient();
  const readClient = serviceRoleSupabase ?? supabase;

  if (!readClient) {
    return null;
  }

  const { data: existing, error: existingError } = await readClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return mapProfile(existing);
  }

  const seedHandle = buildHandleFromUser(user);
  const handle = await makeUniqueHandle(seedHandle, user.id);
  const insertPayload = buildProfileInsertPayload(user, handle);
  const writeClient = serviceRoleSupabase ?? supabase;

  if (!writeClient) {
    return null;
  }

  const { data: inserted, error: insertError } = await writeClient
    .from("profiles")
    .upsert(insertPayload, { onConflict: "id" })
    .select("*")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return mapProfile(inserted);
}

export async function getProfileForCurrentUser() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return ensureProfileForUser(user);
}

export async function getPublicProfileByHandle(handle: string): Promise<PublicCreatorProfileData | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const normalizedHandle = handle.toLowerCase();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", normalizedHandle)
    .eq("is_public", true)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let films:
    | Array<{
        id: string;
        title: string;
        slug: string;
        synopsis: string | null;
        category: PublicFilmCard["category"];
        poster_url: string | null;
        mux_playback_id: string | null;
        published_at: string | null;
        created_at: string;
        staff_pick?: boolean | null;
      }>
    | null = null;

  try {
    const { data, error } = await supabase
      .from("films")
      .select("id, title, slug, synopsis, category, poster_url, mux_playback_id, published_at, created_at, staff_pick")
      .eq("creator_id", profile.id)
      .eq("publish_status", "published")
      .eq("visibility", "public")
      .eq("moderation_status", "active")
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    films = (data ?? []).map((film) => ({ ...film, staff_pick: film.staff_pick ?? false }));
  } catch {
    const { data, error } = await supabase
      .from("films")
      .select("id, title, slug, synopsis, category, poster_url, mux_playback_id, published_at, created_at")
      .eq("creator_id", profile.id)
      .eq("publish_status", "published")
      .eq("visibility", "public")
      .eq("moderation_status", "active")
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    films = (data ?? []).map((film) => ({ ...film, staff_pick: false }));
  }

  const filmIds = (films ?? []).map((film) => film.id);
  const commentCounts = await getFilmCommentCounts(filmIds);
  const likeCounts = await getFilmLikeCounts(filmIds);
  const likedIds = await getViewerLikedFilmIds(filmIds, user?.id);
  const followerCount = await getFollowerCount(String(profile.id));
  const viewerIsFollowing = await getViewerFollowingCreator(String(profile.id), user?.id);
  const foundingCreator = mapFoundingCreator(profile);

  return {
    profile: {
      ...mapProfile(profile),
      followerCount,
      viewerIsFollowing,
      isCurrentUser: user?.id === profile.id,
      foundingCreator,
    },
    films: (films ?? []).map((film) => ({
      id: film.id,
      title: film.title,
      slug: film.slug,
      synopsis: film.synopsis,
      category: film.category,
      posterUrl: film.poster_url ?? null,
      muxPlaybackId: film.mux_playback_id ?? null,
      likeCount: likeCounts.get(film.id) ?? 0,
      commentCount: commentCounts.get(film.id) ?? 0,
      viewerHasLiked: likedIds.has(film.id),
      staffPick: Boolean(film.staff_pick ?? false),
      createdAt: film.created_at,
      creator: {
        handle: String(profile.handle),
        displayName: String(profile.display_name ?? ""),
        avatarUrl: typeof profile.avatar_url === "string" ? profile.avatar_url : null,
        foundingCreator,
      },
      publishedAt: film.published_at,
    })) satisfies PublicFilmCard[],
  };
}

export async function listPublicCreators(limit = 12): Promise<PublicCreatorListItem[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, handle, display_name, bio, avatar_url, is_creator, is_founding_creator, founding_creator_number, founding_creator_awarded_at, founding_creator_featured, founding_creator_notes, founding_creator_invited_at, founding_creator_accepted_at")
    .eq("is_public", true)
    .eq("is_creator", true)
    .limit(limit);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profileIds = (profiles ?? []).map((profile) => profile.id);

  if (profileIds.length === 0) {
    return [];
  }

  const { data: films, error: filmsError } = await supabase
    .from("films")
    .select("id, creator_id, title, slug, synopsis, published_at, series_id")
    .in("creator_id", profileIds)
    .eq("publish_status", "published")
    .eq("visibility", "public")
    .eq("moderation_status", "active")
    .order("published_at", { ascending: false });

  if (filmsError) {
    throw new Error(filmsError.message);
  }

  const filmCountMap = new Map<string, number>();
  const latestPublishedAtMap = new Map<string, string>();
  const seriesCountMap = new Map<string, Set<string>>();
  const releasePreviewMap = new Map<
    string,
    Array<{
      id: string;
      title: string;
      slug: string;
      synopsis: string | null;
      publishedAt: string | null;
    }>
  >();

  for (const film of films ?? []) {
    filmCountMap.set(film.creator_id, (filmCountMap.get(film.creator_id) ?? 0) + 1);

    if (film.published_at && !latestPublishedAtMap.has(film.creator_id)) {
      latestPublishedAtMap.set(film.creator_id, film.published_at);
    }

    if (film.series_id) {
      if (!seriesCountMap.has(film.creator_id)) {
        seriesCountMap.set(film.creator_id, new Set());
      }

      seriesCountMap.get(film.creator_id)?.add(film.series_id);
    }

    const existingPreviews = releasePreviewMap.get(film.creator_id) ?? [];
    if (existingPreviews.length < 2) {
      existingPreviews.push({
        id: film.id,
        title: film.title,
        slug: film.slug,
        synopsis: film.synopsis,
        publishedAt: film.published_at,
      });
      releasePreviewMap.set(film.creator_id, existingPreviews);
    }
  }

  const followerCounts = new Map<string, number>();
  await Promise.all(
    profileIds.map(async (profileId) => {
      followerCounts.set(String(profileId), await getFollowerCount(String(profileId)));
    }),
  );

  return (profiles ?? [])
    .map((profile) => ({
      id: String(profile.id),
      handle: String(profile.handle),
      displayName: String(profile.display_name ?? ""),
      bio: typeof profile.bio === "string" ? profile.bio : null,
      avatarUrl: typeof profile.avatar_url === "string" ? profile.avatar_url : null,
      isCreator: Boolean(profile.is_creator),
      followerCount: followerCounts.get(String(profile.id)) ?? 0,
      publicFilmCount: filmCountMap.get(String(profile.id)) ?? 0,
      seriesCount: seriesCountMap.get(String(profile.id))?.size ?? 0,
      featuredReleases: releasePreviewMap.get(String(profile.id)) ?? [],
      latestPublishedAt: latestPublishedAtMap.get(String(profile.id)) ?? "",
      foundingCreator: mapFoundingCreator(profile),
    }))
    .sort((a, b) => {
      if (a.foundingCreator.isFoundingCreator !== b.foundingCreator.isFoundingCreator) {
        return a.foundingCreator.isFoundingCreator ? -1 : 1;
      }

      if (a.foundingCreator.founderNumber && b.foundingCreator.founderNumber) {
        return a.foundingCreator.founderNumber - b.foundingCreator.founderNumber;
      }

      if (a.latestPublishedAt && b.latestPublishedAt) {
        return b.latestPublishedAt.localeCompare(a.latestPublishedAt);
      }

      if (a.latestPublishedAt) {
        return -1;
      }

      if (b.latestPublishedAt) {
        return 1;
      }

      return b.publicFilmCount - a.publicFilmCount;
    })
    .slice(0, limit);
}

export function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    handle: String(row.handle),
    displayName: String(row.display_name ?? ""),
    bio: typeof row.bio === "string" ? row.bio : null,
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
    bannerUrl: typeof row.banner_url === "string" ? row.banner_url : null,
    websiteUrl: typeof row.website_url === "string" ? row.website_url : null,
    isCreator: Boolean(row.is_creator),
    foundingCreator: mapFoundingCreator(row),
  };
}

export async function listCreatorsToWatch(limit = 8): Promise<PublicCreatorListItem[]> {
  const creators = await listPublicCreators(Math.max(limit * 3, 24));

  return creators
    .filter((creator) => creator.followerCount > 5 || creator.publicFilmCount > 3 || creator.foundingCreator.isFoundingCreator)
    .sort((a, b) => {
      if (a.foundingCreator.isFoundingCreator !== b.foundingCreator.isFoundingCreator) {
        return a.foundingCreator.isFoundingCreator ? -1 : 1;
      }

      if (b.followerCount !== a.followerCount) {
        return b.followerCount - a.followerCount;
      }

      if (b.publicFilmCount !== a.publicFilmCount) {
        return b.publicFilmCount - a.publicFilmCount;
      }

      return (b.latestPublishedAt ?? "").localeCompare(a.latestPublishedAt ?? "");
    })
    .slice(0, limit);
}
