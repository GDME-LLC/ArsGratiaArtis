import type { Profile } from "@/types";
import type {
  CreatorFilmListItem,
  FilmEditorValues,
  PublicFilmCard,
  PublicFilmPageData,
  PublicSeriesPageData,
  ToolOption,
} from "@/types";

import { type FilmCategory } from "@/lib/films/categories";
import {
  getFilmLikeCounts,
  getViewerLikedFilmIds,
} from "@/lib/services/engagement";
import {
  applyFoundingBadgeMetadata,
  getCreatorBadgesByProfileIds,
} from "@/lib/services/badges";
import { getFilmCommentCounts } from "@/lib/services/comments";
import { normalizeSlug } from "@/lib/films/slug";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GLOBAL_FILM_SLUG_MESSAGE =
  "That slug is already in use. For this v1 route, public film slugs must stay globally unique.";

const FILM_CARD_SELECT_WITH_STAFF_PICK =
  "id, title, slug, synopsis, category, poster_url, mux_playback_id, published_at, created_at, creator_id, staff_pick";
const FILM_CARD_SELECT_BASE =
  "id, title, slug, synopsis, category, poster_url, mux_playback_id, published_at, created_at, creator_id";

type PublicFilmRow = {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  category: FilmCategory;
  poster_url: string | null;
  mux_playback_id: string | null;
  published_at: string | null;
  created_at: string;
  creator_id: string;
  staff_pick?: boolean | null;
  is_featured?: boolean | null;
};

function normalizePublicFilmRows(rows: PublicFilmRow[]) {
  return rows.map((film) => ({
    ...film,
    staff_pick: film.staff_pick ?? false,
  }));
}

async function selectPublicFilmRows(
  options: {
    categories?: FilmCategory[];
    from?: number;
    to?: number;
    limit?: number;
    orderBy?: "published_at" | "created_at";
  } = {},
): Promise<{
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  rows: PublicFilmRow[];
}> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return { supabase, rows: [] };
  }

  const runQuery = async (selectClause: string) => {
    let query = supabase
      .from("films")
      .select(selectClause)
      .eq("publish_status", "published")
      .eq("visibility", "public")
      .eq("moderation_status", "active");

    if (options.categories && options.categories.length > 0) {
      query = query.in("category", options.categories);
    }

    query = query.order(options.orderBy ?? "published_at", { ascending: false });

    if (typeof options.limit === "number") {
      query = query.limit(options.limit);
    }

    if (typeof options.from === "number" && typeof options.to === "number") {
      query = query.range(options.from, options.to);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data ?? []) as unknown as PublicFilmRow[];
  };

  try {
    const rows = await runQuery(FILM_CARD_SELECT_WITH_STAFF_PICK);
    return { supabase, rows: normalizePublicFilmRows(rows) };
  } catch {
    const rows = await runQuery(FILM_CARD_SELECT_BASE);
    return { supabase, rows: normalizePublicFilmRows(rows) };
  }
}

async function listFilmToolIds(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | ReturnType<typeof createServiceRoleSupabaseClient>,
  filmId: string,
): Promise<string[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("film_tools")
    .select("tool_id")
    .eq("film_id", filmId);

  if (error) {
    throw new Error(error.message);
  }

  return [...new Set((data ?? []).map((row) => String(row.tool_id)))];
}

async function syncFilmTools(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | ReturnType<typeof createServiceRoleSupabaseClient>,
  filmId: string,
  toolIds: string[],
) {
  if (!supabase) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("film_tools")
    .delete()
    .eq("film_id", filmId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (toolIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("film_tools")
    .insert(toolIds.map((toolId) => ({ film_id: filmId, tool_id: toolId })));

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function listCreatorFilms(creatorId: string): Promise<CreatorFilmListItem[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("films")
    .select("id, title, slug, synopsis, category, poster_url, mux_playback_id, visibility, publish_status, moderation_status, moderation_reason, reviewed_at, created_at, updated_at")
    .eq("creator_id", creatorId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((film) => ({
    id: film.id,
    title: film.title,
    slug: film.slug,
    synopsis: film.synopsis,
    category: film.category,
    posterUrl: film.poster_url ?? null,
    muxPlaybackId: film.mux_playback_id ?? null,
    visibility: film.visibility,
    publishStatus: film.publish_status,
    moderationStatus: film.moderation_status ?? "active",
    moderationReason: film.moderation_reason ?? null,
    reviewedAt: film.reviewed_at ?? null,
    createdAt: film.created_at,
    updatedAt: film.updated_at,
  }));
}

export async function getCreatorFilmById(
  filmId: string,
  creatorId: string,
): Promise<FilmEditorValues | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("films")
    .select("id, title, slug, synopsis, description, category, poster_url, mux_asset_id, mux_playback_id, prompt_text, process_summary, process_notes, process_tags, prompt_visibility, visibility, publish_status, moderation_status, moderation_reason, reviewed_at")
    .eq("id", filmId)
    .eq("creator_id", creatorId)
    .eq("publish_status", "draft")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const selectedToolIds = await listFilmToolIds(supabase, filmId);

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    synopsis: data.synopsis ?? "",
    description: data.description ?? "",
    category: data.category,
    posterUrl: data.poster_url ?? "",
    muxAssetId: data.mux_asset_id ?? null,
    muxPlaybackId: data.mux_playback_id ?? null,
    promptText: data.prompt_text ?? "",
    processSummary: data.process_summary ?? "",
    processNotes: data.process_notes ?? "",
    processTags: Array.isArray(data.process_tags) ? data.process_tags.filter((tag): tag is string => typeof tag === "string") : [],
    selectedToolIds,
    promptVisibility: data.prompt_visibility,
    visibility: data.visibility,
    publishStatus: data.publish_status,
    moderationStatus: data.moderation_status ?? "active",
    moderationReason: data.moderation_reason ?? "",
    reviewedAt: data.reviewed_at ?? null,
  };
}

export async function isFilmSlugAvailable(slug: string, excludeFilmId?: string) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return true;
  }

  let query = supabase.from("films").select("id").eq("slug", slug).limit(1);

  if (excludeFilmId) {
    query = query.neq("id", excludeFilmId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return !data;
}

function isFilmSlugConflictError(error: { code?: string; message: string; details?: string }) {
  return (
    error.code === "23505" &&
    (error.message.toLowerCase().includes("films_slug_key") ||
      error.details?.toLowerCase().includes("(slug)") === true)
  );
}

export async function createOrUpdateFilm(input: {
  filmId?: string;
  creator: Profile;
  title: string;
  slug: string;
  synopsis: string | null;
  description: string | null;
  category: FilmCategory;
  posterUrl: string | null;
  promptText: string | null;
  processSummary: string | null;
  processNotes: string | null;
  processTags: string[];
  toolIds: string[];
  promptVisibility: "public" | "followers" | "private";
  visibility: "public" | "unlisted" | "private";
  publishStatus: "draft" | "published" | "archived";
  workflowDraftId?: string | null;
}) {
  const supabase = await createServerSupabaseClient();
  const serviceRoleSupabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const publishedAt = input.publishStatus === "published" ? new Date().toISOString() : null;

  if (input.filmId) {
    const { data: existing, error: existingError } = await supabase
      .from("films")
      .select("id")
      .eq("id", input.filmId)
      .eq("creator_id", input.creator.id)
      .eq("publish_status", "draft")
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (!existing) {
      throw new Error("Only your own draft films can be edited in this v1.");
    }

    const updatePayload: Record<string, unknown> = {
      title: input.title,
      slug: input.slug,
      synopsis: input.synopsis,
      description: input.description,
      category: input.category,
      poster_url: input.posterUrl,
      prompt_text: input.promptText,
      process_summary: input.processSummary,
      process_notes: input.processNotes,
      process_tags: input.processTags,
      prompt_visibility: input.promptVisibility,
      visibility: input.visibility,
      publish_status: input.publishStatus,
      published_at: publishedAt,
    };

    if (input.workflowDraftId) {
      updatePayload.workflow_draft_id = input.workflowDraftId;
    }

    const { data, error } = await supabase
      .from("films")
      .update(updatePayload)
      .eq("id", input.filmId)
      .eq("creator_id", input.creator.id)
      .select("id, slug")
      .single();

    if (error) {
      if (isFilmSlugConflictError(error)) {
        throw new Error(GLOBAL_FILM_SLUG_MESSAGE);
      }

      throw new Error(error.message);
    }

    await syncFilmTools(serviceRoleSupabase ?? supabase, data.id, input.toolIds);
    return data;
  }

  const { data, error } = await supabase
    .from("films")
    .insert({
      creator_id: input.creator.id,
      workflow_draft_id: input.workflowDraftId ?? null,
      title: input.title,
      slug: input.slug,
      synopsis: input.synopsis,
      description: input.description,
      category: input.category,
      poster_url: input.posterUrl,
      prompt_text: input.promptText,
      process_summary: input.processSummary,
      process_notes: input.processNotes,
      process_tags: input.processTags,
      prompt_visibility: input.promptVisibility,
      visibility: input.visibility,
      publish_status: input.publishStatus,
      published_at: publishedAt,
    })
    .select("id, slug")
    .single();

  if (error) {
    if (isFilmSlugConflictError(error)) {
      throw new Error(GLOBAL_FILM_SLUG_MESSAGE);
    }

    throw new Error(error.message);
  }

  await syncFilmTools(serviceRoleSupabase ?? supabase, data.id, input.toolIds);
  return data;
}

export async function getDraftFilmOwnership(
  filmId: string,
  creatorId: string,
): Promise<{ id: string; muxAssetId: string | null; muxPlaybackId: string | null } | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("films")
    .select("id, mux_asset_id, mux_playback_id")
    .eq("id", filmId)
    .eq("creator_id", creatorId)
    .eq("publish_status", "draft")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    muxAssetId: data.mux_asset_id ?? null,
    muxPlaybackId: data.mux_playback_id ?? null,
  };
}

export async function attachMuxAssetToDraftFilm(input: {
  filmId: string;
  creatorId: string;
  muxAssetId: string;
  muxPlaybackId: string | null;
}) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("films")
    .update({
      mux_asset_id: input.muxAssetId,
      mux_playback_id: input.muxPlaybackId,
    })
    .eq("id", input.filmId)
    .eq("creator_id", input.creatorId)
    .eq("publish_status", "draft")
    .select("id, mux_asset_id, mux_playback_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    muxAssetId: data.mux_asset_id ?? null,
    muxPlaybackId: data.mux_playback_id ?? null,
  };
}

export async function getPublicFilmBySlug(slug: string): Promise<PublicFilmPageData | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;
  let viewerIsCreator = false;

  if (viewerId) {
    const { data: viewerProfile, error: viewerProfileError } = await supabase
      .from("profiles")
      .select("is_creator")
      .eq("id", viewerId)
      .maybeSingle();

    if (viewerProfileError) {
      throw new Error(viewerProfileError.message);
    }

    viewerIsCreator = Boolean(viewerProfile?.is_creator);
  }

  const { data, error } = await supabase
    .from("films")
    .select("id, title, slug, synopsis, description, category, poster_url, mux_playback_id, prompt_text, process_summary, process_notes, process_tags, prompt_visibility, published_at, creator_id, visibility, moderation_status, moderation_reason, reviewed_at, series_id, season_number, episode_number")
    .eq("slug", slug.toLowerCase())
    .eq("publish_status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const isOwner = user?.id === data.creator_id;

  if ((!isOwner && data.visibility !== "public") || (!isOwner && data.moderation_status !== "active")) {
    return null;
  }

  const [commentCounts, likeCounts, likedIds] = await Promise.all([
    getFilmCommentCounts([data.id]),
    getFilmLikeCounts([data.id]),
    getViewerLikedFilmIds([data.id], user?.id),
  ]);

  const profileSelectBase = "handle, display_name, avatar_url, is_founding_creator, founding_creator_number, founding_creator_awarded_at, founding_creator_featured, founding_creator_notes, founding_creator_invited_at, founding_creator_accepted_at";
  const profileSelectWithFollowers = `follower_count, ${profileSelectBase}`;

  let profile: {
    handle?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    follower_count?: number | null;
    is_founding_creator?: boolean | null;
    founding_creator_number?: number | null;
    founding_creator_awarded_at?: string | null;
    founding_creator_featured?: boolean | null;
    founding_creator_notes?: string | null;
    founding_creator_invited_at?: string | null;
    founding_creator_accepted_at?: string | null;
  } | null = null;

  try {
    const { data: profileWithFollowers, error: profileWithFollowersError } = await supabase
      .from("profiles")
      .select(profileSelectWithFollowers)
      .eq("id", data.creator_id)
      .maybeSingle();

    if (profileWithFollowersError) {
      throw profileWithFollowersError;
    }

    profile = profileWithFollowers;
  } catch {
    const { data: fallbackProfile, error: fallbackProfileError } = await supabase
      .from("profiles")
      .select(profileSelectBase)
      .eq("id", data.creator_id)
      .maybeSingle();

    if (fallbackProfileError) {
      throw new Error(fallbackProfileError.message);
    }

    profile = fallbackProfile;
  }
  const badgeMap = await getCreatorBadgesByProfileIds([String(data.creator_id)]);

  let isFollower = false;

  if (user?.id && user.id !== data.creator_id) {
    const { data: followRow, error: followError } = await supabase
      .from("creator_follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("creator_id", data.creator_id)
      .maybeSingle();

    if (followError) {
      throw new Error(followError.message);
    }

    isFollower = Boolean(followRow);
  }

  const canViewPrompt =
    data.prompt_visibility === "public" ||
    (data.prompt_visibility === "followers" &&
      (user?.id === data.creator_id || isFollower));

  const { data: filmToolRows, error: filmToolsError } = await supabase
    .from("film_tools")
    .select("tool_id")
    .eq("film_id", data.id);

  if (filmToolsError) {
    throw new Error(filmToolsError.message);
  }

  const toolIds = [...new Set((filmToolRows ?? []).map((row) => row.tool_id))];
  let tools: ToolOption[] = [];

  if (toolIds.length > 0) {
    const { data: toolRows, error: toolsError } = await supabase
      .from("tools")
      .select("id, name, slug, category, description, website_url, is_featured")
      .in("id", toolIds)
      .order("name", { ascending: true });

    if (toolsError) {
      throw new Error(toolsError.message);
    }

    tools = (toolRows ?? []).map((tool) => ({
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      category: tool.category ?? null,
      description: tool.description ?? null,
      websiteUrl: tool.website_url ?? null,
      isFeatured: Boolean(tool.is_featured),
    }));
  }

  let series: PublicFilmPageData["series"] = null;

  if (data.series_id) {
    const { data: seriesRow, error: seriesError } = await supabase
      .from("series")
      .select("id, title, slug")
      .eq("id", data.series_id)
      .maybeSingle();

    if (seriesError) {
      throw new Error(seriesError.message);
    }

    if (seriesRow) {
      const { data: seriesEpisodes, error: seriesEpisodesError } = await supabase
        .from("films")
        .select("id, title, slug, season_number, episode_number")
        .eq("series_id", data.series_id)
        .eq("publish_status", "published")
        .eq("visibility", "public")
        .eq("moderation_status", "active")
        .order("season_number", { ascending: true, nullsFirst: false })
        .order("episode_number", { ascending: true, nullsFirst: false })
        .order("published_at", { ascending: true });

      if (seriesEpisodesError) {
        throw new Error(seriesEpisodesError.message);
      }

      const currentEpisodeIndex = (seriesEpisodes ?? []).findIndex((episode) => episode.id === data.id);
      const nextEpisode =
        currentEpisodeIndex >= 0 ? (seriesEpisodes ?? [])[currentEpisodeIndex + 1] : null;

      series = {
        id: seriesRow.id,
        title: seriesRow.title,
        slug: seriesRow.slug,
        seasonNumber: data.season_number ?? null,
        episodeNumber: data.episode_number ?? null,
        nextEpisode: nextEpisode
          ? {
              title: nextEpisode.title,
              slug: nextEpisode.slug,
              seasonNumber: nextEpisode.season_number ?? null,
              episodeNumber: nextEpisode.episode_number ?? null,
            }
          : null,
      };
    }
  }

  const foundingCreator = {
    isFoundingCreator: Boolean(profile?.is_founding_creator),
    founderNumber: typeof profile?.founding_creator_number === "number" ? profile.founding_creator_number : null,
    awardedAt: typeof profile?.founding_creator_awarded_at === "string" ? profile.founding_creator_awarded_at : null,
    featured: profile?.founding_creator_featured !== false,
    notes: typeof profile?.founding_creator_notes === "string" ? profile.founding_creator_notes : null,
    invitedAt: typeof profile?.founding_creator_invited_at === "string" ? profile.founding_creator_invited_at : null,
    acceptedAt: typeof profile?.founding_creator_accepted_at === "string" ? profile.founding_creator_accepted_at : null,
  };
  const creatorBadges = applyFoundingBadgeMetadata(badgeMap.get(String(data.creator_id)) ?? [], foundingCreator);

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    synopsis: data.synopsis,
    description: data.description,
    category: data.category,
    posterUrl: data.poster_url,
    muxPlaybackId: data.mux_playback_id ?? null,
    creation: {
      promptText: canViewPrompt ? data.prompt_text ?? null : null,
      processSummary: data.process_summary ?? null,
      processNotes: data.process_notes ?? null,
      processTags: Array.isArray(data.process_tags) ? data.process_tags.filter((tag): tag is string => typeof tag === "string") : [],
      promptVisibility: data.prompt_visibility,
      tools,
    },
    engagement: {
      likeCount: likeCounts.get(data.id) ?? 0,
      viewerHasLiked: likedIds.has(data.id),
      commentCount: commentCounts.get(data.id) ?? 0,
    },
    series,
    publishedAt: data.published_at,
    creator: {
      id: data.creator_id,
      handle: String(profile?.handle ?? ""),
      displayName: String(profile?.display_name ?? ""),
      avatarUrl: typeof profile?.avatar_url === "string" ? profile.avatar_url : null,
      followerCount: typeof profile?.follower_count === "number" ? profile.follower_count : 0,
      viewerIsFollowing: isFollower,
      viewerCanFollow: Boolean(viewerId) && viewerIsCreator && viewerId !== data.creator_id,
      isCurrentUser: Boolean(viewerId) && viewerId === data.creator_id,
      foundingCreator,
      badges: creatorBadges,
    },
    isOwner,
    moderationStatus: data.moderation_status ?? "active",
    moderationReason: data.moderation_reason ?? null,
    reviewedAt: data.reviewed_at ?? null,
  };
}

async function hydratePublicFilmCards(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  films: PublicFilmRow[],
): Promise<PublicFilmCard[]> {
  if (!supabase || films.length === 0) {
    return [];
  }

  const creatorIds = [...new Set(films.map((film) => film.creator_id))];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url, is_founding_creator, founding_creator_number, founding_creator_awarded_at, founding_creator_featured, founding_creator_notes, founding_creator_invited_at, founding_creator_accepted_at")
    .in("id", creatorIds);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const likeCounts = await getFilmLikeCounts(films.map((film) => film.id));
  const commentCounts = await getFilmCommentCounts(films.map((film) => film.id));
  const likedIds = await getViewerLikedFilmIds(
    films.map((film) => film.id),
    user?.id,
  );
  const badgeMap = await getCreatorBadgesByProfileIds(creatorIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      (() => {
        const foundingCreator = {
          isFoundingCreator: Boolean(profile.is_founding_creator),
          founderNumber: typeof profile.founding_creator_number === "number" ? profile.founding_creator_number : null,
          awardedAt: typeof profile.founding_creator_awarded_at === "string" ? profile.founding_creator_awarded_at : null,
          featured: profile.founding_creator_featured !== false,
          notes: typeof profile.founding_creator_notes === "string" ? profile.founding_creator_notes : null,
          invitedAt: typeof profile.founding_creator_invited_at === "string" ? profile.founding_creator_invited_at : null,
          acceptedAt: typeof profile.founding_creator_accepted_at === "string" ? profile.founding_creator_accepted_at : null,
        };

        return {
          handle: String(profile.handle ?? ""),
          displayName: String(profile.display_name ?? ""),
          avatarUrl: typeof profile.avatar_url === "string" ? profile.avatar_url : null,
          foundingCreator,
          badges: applyFoundingBadgeMetadata(badgeMap.get(String(profile.id)) ?? [], foundingCreator),
        };
      })(),
    ]),
  );

  return films.map((film) => ({
    id: film.id,
    title: film.title,
    slug: film.slug,
    synopsis: film.synopsis,
    category: film.category,
    posterUrl: film.poster_url,
    muxPlaybackId: film.mux_playback_id ?? null,
    likeCount: likeCounts.get(film.id) ?? 0,
    commentCount: commentCounts.get(film.id) ?? 0,
    viewerHasLiked: likedIds.has(film.id),
    staffPick: Boolean(film.staff_pick ?? false),
    createdAt: film.created_at,
    publishedAt: film.published_at,
    creator: profileMap.get(film.creator_id) ?? {
      handle: "",
      displayName: "",
      avatarUrl: null,
      foundingCreator: {
        isFoundingCreator: false,
        founderNumber: null,
        awardedAt: null,
        featured: true,
        notes: null,
        invitedAt: null,
        acceptedAt: null,
      },
      badges: [],
    },
  }));
}

export async function listCuratedFilms(input?: {
  pageSize?: number;
}): Promise<PublicFilmCard[]> {
  const films = await listStaffPickFilms(input?.pageSize ?? 3);

  if (films.length > 0) {
    return films;
  }

  const fallback = await listPublishedFilms({ page: 1, pageSize: input?.pageSize ?? 3 });
  return fallback.films;
}

export async function listStaffPickFilms(limit = 8): Promise<PublicFilmCard[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const pageSize = Math.min(12, Math.max(1, limit));

  try {
    const { data, error } = await supabase
      .from("films")
      .select("id, title, slug, synopsis, category, poster_url, mux_playback_id, published_at, created_at, creator_id, staff_pick")
      .eq("publish_status", "published")
      .eq("visibility", "public")
      .eq("moderation_status", "active")
      .eq("staff_pick", true)
      .order("created_at", { ascending: false })
      .limit(pageSize);

    if (error) {
      throw error;
    }

    return hydratePublicFilmCards(supabase, normalizePublicFilmRows((data ?? []) as PublicFilmRow[]));
  } catch {
    try {
      const { data, error } = await supabase
        .from("films")
        .select("id, title, slug, synopsis, category, poster_url, mux_playback_id, published_at, created_at, creator_id, is_featured")
        .eq("publish_status", "published")
        .eq("visibility", "public")
        .eq("moderation_status", "active")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(pageSize);

      if (error) {
        throw error;
      }

      return hydratePublicFilmCards(
        supabase,
        normalizePublicFilmRows(((data ?? []) as PublicFilmRow[]).map((film) => ({ ...film, staff_pick: true }))),
      );
    } catch {
      const { supabase: fallbackSupabase, rows } = await selectPublicFilmRows({ limit: pageSize, orderBy: "created_at" });

      if (!fallbackSupabase) {
        return [];
      }

      return hydratePublicFilmCards(fallbackSupabase, rows.slice(0, pageSize));
    }
  }
}

export async function getPublicFilmCardById(filmId: string): Promise<PublicFilmCard | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const runQuery = async (selectClause: string) => {
    const { data, error } = await supabase
      .from("films")
      .select(selectClause)
      .eq("id", filmId)
      .eq("publish_status", "published")
      .eq("visibility", "public")
      .eq("moderation_status", "active")
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? normalizePublicFilmRows([((data as unknown) as PublicFilmRow)])[0] ?? null : null;
  };

  try {
    const row = await runQuery(FILM_CARD_SELECT_WITH_STAFF_PICK);

    if (!row) {
      return null;
    }

    const films = await hydratePublicFilmCards(supabase, [row]);
    return films[0] ?? null;
  } catch {
    const row = await runQuery(FILM_CARD_SELECT_BASE);

    if (!row) {
      return null;
    }

    const films = await hydratePublicFilmCards(supabase, [row]);
    return films[0] ?? null;
  }
}

export async function listPublishedFilms(input?: {
  page?: number;
  pageSize?: number;
  categories?: FilmCategory[];
  excludeIds?: string[];
  sortBy?: "published_at" | "created_at" | "likes";
}): Promise<{ films: PublicFilmCard[]; hasMore: boolean }> {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(24, Math.max(1, input?.pageSize ?? 9));
  const sortBy = input?.sortBy ?? "published_at";
  const from = (page - 1) * pageSize;
  const fetchSize = sortBy === "likes" ? Math.min(72, pageSize * 6) : pageSize + 1;
  const to = from + fetchSize - 1;
  const orderBy = sortBy === "likes" ? "created_at" : sortBy;

  const { supabase, rows } = await selectPublicFilmRows({
    categories: input?.categories,
    from,
    to,
    orderBy,
  });

  if (!supabase) {
    return {
      films: [],
      hasMore: false,
    };
  }

  const excludedIds = new Set(input?.excludeIds ?? []);
  const filteredRows = rows.filter((film) => !excludedIds.has(film.id));

  if (filteredRows.length === 0) {
    return {
      films: [],
      hasMore: false,
    };
  }

  const hydrated = await hydratePublicFilmCards(supabase, filteredRows);
  const sorted =
    sortBy === "likes"
      ? [...hydrated].sort((a, b) => {
          if (b.likeCount !== a.likeCount) {
            return b.likeCount - a.likeCount;
          }

          return b.createdAt.localeCompare(a.createdAt);
        })
      : hydrated;

  return {
    films: sorted.slice(0, pageSize),
    hasMore: sorted.length > pageSize,
  };
}

export async function getPublicSeriesBySlug(
  slug: string,
): Promise<PublicSeriesPageData | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: seriesRow, error: seriesError } = await supabase
    .from("series")
    .select("id, title, slug, description, poster_url, creator_id")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();

  if (seriesError) {
    throw new Error(seriesError.message);
  }

  if (!seriesRow) {
    return null;
  }

  const { data: creatorRow, error: creatorError } = await supabase
    .from("profiles")
    .select("handle, display_name, avatar_url, is_founding_creator, founding_creator_number, founding_creator_awarded_at, founding_creator_featured, founding_creator_notes, founding_creator_invited_at, founding_creator_accepted_at")
    .eq("id", seriesRow.creator_id)
    .maybeSingle();

  if (creatorError) {
    throw new Error(creatorError.message);
  }

  const { data: episodes, error: episodesError } = await supabase
    .from("films")
    .select("id, title, slug, synopsis, category, poster_url, season_number, episode_number, published_at")
    .eq("series_id", seriesRow.id)
    .eq("publish_status", "published")
    .eq("visibility", "public")
    .eq("moderation_status", "active")
    .order("season_number", { ascending: true, nullsFirst: false })
    .order("episode_number", { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: true });

  if (episodesError) {
    throw new Error(episodesError.message);
  }

  return {
    series: {
      id: seriesRow.id,
      title: seriesRow.title,
      slug: seriesRow.slug,
      description: seriesRow.description,
      posterUrl: seriesRow.poster_url,
      creator: {
        handle: String(creatorRow?.handle ?? ""),
        displayName: String(creatorRow?.display_name ?? ""),
        avatarUrl: typeof creatorRow?.avatar_url === "string" ? creatorRow.avatar_url : null,
      },
    },
    episodes: (episodes ?? []).map((episode) => ({
      id: episode.id,
      title: episode.title,
      slug: episode.slug,
      synopsis: episode.synopsis,
      category: episode.category,
      posterUrl: episode.poster_url,
      seasonNumber: episode.season_number ?? null,
      episodeNumber: episode.episode_number ?? null,
      publishedAt: episode.published_at,
    })),
  };
}


