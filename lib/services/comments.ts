import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FilmComment } from "@/types";

export async function getFilmCommentCounts(filmIds: string[]) {
  const supabase = await createServerSupabaseClient();

  if (!supabase || filmIds.length === 0) {
    return new Map<string, number>();
  }

  const { data, error } = await supabase
    .from("comments")
    .select("film_id")
    .eq("is_deleted", false)
    .in("film_id", filmIds);

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();

  for (const row of data ?? []) {
    counts.set(row.film_id, (counts.get(row.film_id) ?? 0) + 1);
  }

  return counts;
}

export async function listFilmComments(filmId: string): Promise<FilmComment[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("comments")
    .select("id, author_id, body, is_deleted, created_at")
    .eq("film_id", filmId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const authorIds = [...new Set(rows.map((row) => row.author_id))];

  let authorMap = new Map<
    string,
    { displayName: string; handle: string; avatarUrl: string | null }
  >();

  if (authorIds.length > 0) {
    const { data: authors, error: authorsError } = await supabase
      .from("profiles")
      .select("id, display_name, handle, avatar_url")
      .in("id", authorIds);

    if (authorsError) {
      throw new Error(authorsError.message);
    }

    authorMap = new Map(
      (authors ?? []).map((author) => [
        author.id,
        {
          displayName: String(author.display_name ?? "Creator"),
          handle: String(author.handle ?? ""),
          avatarUrl: typeof author.avatar_url === "string" ? author.avatar_url : null,
        },
      ]),
    );
  }

  return rows.map((row) => {
    const author = authorMap.get(row.author_id);
    const fallbackDisplayName = author?.displayName ?? "Creator";
    const fallbackHandle = author?.handle ?? "";

    return {
      id: row.id,
      authorId: row.author_id,
      authorDisplayName: row.is_deleted ? "Removed user" : fallbackDisplayName,
      authorHandle: row.is_deleted ? "" : fallbackHandle,
      authorAvatarUrl: author?.avatarUrl ?? null,
      body: row.is_deleted ? "" : row.body,
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
    };
  });
}
