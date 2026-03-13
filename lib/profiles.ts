import type { User } from "@supabase/supabase-js";

import {
  getFollowerCount,
  getFilmLikeCounts,
  getViewerFollowingCreator,
  getViewerLikedFilmIds,
} from "@/lib/services/engagement";
import { getFilmCommentCounts } from "@/lib/services/comments";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile, PublicCreatorProfileData, PublicFilmCard } from "@/types";

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

async function makeUniqueHandle(
  seed: string,
  userId: string,
  currentHandle?: string | null,
) {
  const supabase = await createServerSupabaseClient();

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

  if (!supabase) {
    return null;
  }

  const { data: existing, error: existingError } = await supabase
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
  const displayName =
    (typeof user.user_metadata?.display_name === "string" &&
      user.user_metadata.display_name.trim()) ||
    user.email?.split("@")[0] ||
    "Creator";

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      handle,
      display_name: displayName,
      is_creator: false,
    })
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

  const { data: films, error: filmsError } = await supabase
    .from("films")
    .select("id, title, slug, synopsis, published_at")
    .eq("creator_id", profile.id)
    .eq("publish_status", "published")
    .eq("visibility", "public")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (filmsError) {
    throw new Error(filmsError.message);
  }

  const filmIds = (films ?? []).map((film) => film.id);
  const commentCounts = await getFilmCommentCounts(filmIds);
  const likeCounts = await getFilmLikeCounts(filmIds);
  const likedIds = await getViewerLikedFilmIds(filmIds, user?.id);
  const followerCount = await getFollowerCount(String(profile.id));
  const viewerIsFollowing = await getViewerFollowingCreator(String(profile.id), user?.id);

  return {
    profile: {
      ...mapProfile(profile),
      followerCount,
      viewerIsFollowing,
      isCurrentUser: user?.id === profile.id,
    },
    films: (films ?? []).map((film) => ({
      id: film.id,
      title: film.title,
      slug: film.slug,
      synopsis: film.synopsis,
      posterUrl: null,
      likeCount: likeCounts.get(film.id) ?? 0,
      commentCount: commentCounts.get(film.id) ?? 0,
      viewerHasLiked: likedIds.has(film.id),
      creator: {
        handle: String(profile.handle),
        displayName: String(profile.display_name ?? ""),
        avatarUrl: typeof profile.avatar_url === "string" ? profile.avatar_url : null,
      },
      publishedAt: film.published_at,
    })) satisfies PublicFilmCard[],
  };
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
  };
}
