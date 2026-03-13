import type { Profile } from "@/types";
import type {
  CreatorFilmListItem,
  FilmEditorValues,
  PublicFilmCard,
  PublicFilmPageData,
  PublicSeriesPageData,
} from "@/types";

import {
  getFilmLikeCounts,
  getViewerLikedFilmIds,
} from "@/lib/services/engagement";
import { getFilmCommentCounts } from "@/lib/services/comments";
import { normalizeSlug } from "@/lib/films/slug";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GLOBAL_FILM_SLUG_MESSAGE =
  "That slug is already in use. For this v1 route, public film slugs must stay globally unique.";

export async function listCreatorFilms(creatorId: string): Promise<CreatorFilmListItem[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("films")
    .select("id, title, slug, synopsis, visibility, publish_status, created_at, updated_at")
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
    visibility: film.visibility,
    publishStatus: film.publish_status,
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
    .select("id, title, slug, synopsis, description, poster_url, mux_asset_id, mux_playback_id, prompt_text, workflow_notes, prompt_visibility, visibility, publish_status")
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
    title: data.title,
    slug: data.slug,
    synopsis: data.synopsis ?? "",
    description: data.description ?? "",
    posterUrl: data.poster_url ?? "",
    muxAssetId: data.mux_asset_id ?? null,
    muxPlaybackId: data.mux_playback_id ?? null,
    promptText: data.prompt_text ?? "",
    workflowNotes: data.workflow_notes ?? "",
    promptVisibility: data.prompt_visibility,
    visibility: data.visibility,
    publishStatus: data.publish_status,
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
  posterUrl: string | null;
  promptText: string | null;
  workflowNotes: string | null;
  promptVisibility: "public" | "followers" | "private";
  visibility: "public" | "unlisted" | "private";
  publishStatus: "draft" | "published" | "archived";
}) {
  const supabase = await createServerSupabaseClient();

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

    const { data, error } = await supabase
      .from("films")
      .update({
        title: input.title,
        slug: input.slug,
        synopsis: input.synopsis,
        description: input.description,
        poster_url: input.posterUrl,
        prompt_text: input.promptText,
        workflow_notes: input.workflowNotes,
        prompt_visibility: input.promptVisibility,
        visibility: input.visibility,
        publish_status: input.publishStatus,
        published_at: publishedAt,
      })
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

    return data;
  }

  const { data, error } = await supabase
    .from("films")
    .insert({
      creator_id: input.creator.id,
      title: input.title,
      slug: input.slug,
      synopsis: input.synopsis,
      description: input.description,
      poster_url: input.posterUrl,
      prompt_text: input.promptText,
      workflow_notes: input.workflowNotes,
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

  const { data, error } = await supabase
    .from("films")
    .select("id, title, slug, synopsis, description, poster_url, mux_playback_id, prompt_text, workflow_notes, prompt_visibility, published_at, creator_id, series_id, season_number, episode_number")
    .eq("slug", slug.toLowerCase())
    .eq("publish_status", "published")
    .eq("visibility", "public")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const commentCounts = await getFilmCommentCounts([data.id]);
  const likeCounts = await getFilmLikeCounts([data.id]);
  const likedIds = await getViewerLikedFilmIds([data.id], user?.id);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("handle, display_name, avatar_url")
    .eq("id", data.creator_id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

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
  let tools: Array<{ id: string; name: string; slug: string }> = [];

  if (toolIds.length > 0) {
    const { data: toolRows, error: toolsError } = await supabase
      .from("tools")
      .select("id, name, slug")
      .in("id", toolIds)
      .order("name", { ascending: true });

    if (toolsError) {
      throw new Error(toolsError.message);
    }

    tools = (toolRows ?? []).map((tool) => ({
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
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

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    synopsis: data.synopsis,
    description: data.description,
    posterUrl: data.poster_url,
    muxPlaybackId: data.mux_playback_id ?? null,
    creation: {
      promptText: canViewPrompt ? data.prompt_text ?? null : null,
      workflowNotes: data.workflow_notes ?? null,
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
      handle: String(profile?.handle ?? ""),
      displayName: String(profile?.display_name ?? ""),
      avatarUrl: typeof profile?.avatar_url === "string" ? profile.avatar_url : null,
    },
  };
}

export async function listPublishedFilms(input?: {
  page?: number;
  pageSize?: number;
}): Promise<{ films: PublicFilmCard[]; hasMore: boolean }> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return {
      films: [],
      hasMore: false,
    };
  }

  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(24, Math.max(1, input?.pageSize ?? 9));
  const from = (page - 1) * pageSize;
  const to = from + pageSize;

  const { data, error } = await supabase
    .from("films")
    .select("id, title, slug, synopsis, poster_url, published_at, creator_id")
    .eq("publish_status", "published")
    .eq("visibility", "public")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const films = data ?? [];

  if (films.length === 0) {
    return {
      films: [],
      hasMore: false,
    };
  }

  const creatorIds = [...new Set(films.map((film) => film.creator_id))];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url")
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

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      {
        handle: String(profile.handle ?? ""),
        displayName: String(profile.display_name ?? ""),
        avatarUrl: typeof profile.avatar_url === "string" ? profile.avatar_url : null,
      },
    ]),
  );

  return {
    films: films.slice(0, pageSize).map((film) => ({
      id: film.id,
      title: film.title,
      slug: film.slug,
      synopsis: film.synopsis,
      posterUrl: film.poster_url,
      likeCount: likeCounts.get(film.id) ?? 0,
      commentCount: commentCounts.get(film.id) ?? 0,
      viewerHasLiked: likedIds.has(film.id),
      publishedAt: film.published_at,
      creator: profileMap.get(film.creator_id) ?? {
        handle: "",
        displayName: "",
        avatarUrl: null,
      },
    })),
    hasMore: films.length > pageSize,
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
    .select("handle, display_name, avatar_url")
    .eq("id", seriesRow.creator_id)
    .maybeSingle();

  if (creatorError) {
    throw new Error(creatorError.message);
  }

  const { data: episodes, error: episodesError } = await supabase
    .from("films")
    .select("id, title, slug, synopsis, poster_url, season_number, episode_number, published_at")
    .eq("series_id", seriesRow.id)
    .eq("publish_status", "published")
    .eq("visibility", "public")
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
      posterUrl: episode.poster_url,
      seasonNumber: episode.season_number ?? null,
      episodeNumber: episode.episode_number ?? null,
      publishedAt: episode.published_at,
    })),
  };
}
