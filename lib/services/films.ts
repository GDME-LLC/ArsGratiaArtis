import type { Profile } from "@/types";
import type {
  CreatorFilmListItem,
  FilmEditorValues,
  PublicFilmPageData,
} from "@/types";

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
    .select("id, title, slug, synopsis, description, poster_url, visibility, publish_status")
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

export async function getPublicFilmBySlug(slug: string): Promise<PublicFilmPageData | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("films")
    .select("id, title, slug, synopsis, description, poster_url, published_at, creator_id")
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("handle, display_name, avatar_url")
    .eq("id", data.creator_id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    synopsis: data.synopsis,
    description: data.description,
    posterUrl: data.poster_url,
    publishedAt: data.published_at,
    creator: {
      handle: String(profile?.handle ?? ""),
      displayName: String(profile?.display_name ?? ""),
      avatarUrl: typeof profile?.avatar_url === "string" ? profile.avatar_url : null,
    },
  };
}
