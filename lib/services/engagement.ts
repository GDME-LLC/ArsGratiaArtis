import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getFilmLikeCounts(filmIds: string[]) {
  const supabase = await createServerSupabaseClient();

  if (!supabase || filmIds.length === 0) {
    return new Map<string, number>();
  }

  const { data, error } = await supabase
    .from("film_likes")
    .select("film_id")
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

export async function getViewerLikedFilmIds(filmIds: string[], viewerId?: string | null) {
  const supabase = await createServerSupabaseClient();

  if (!supabase || !viewerId || filmIds.length === 0) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from("film_likes")
    .select("film_id")
    .eq("profile_id", viewerId)
    .in("film_id", filmIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => row.film_id));
}

export async function getFollowerCount(creatorId: string) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from("creator_follows")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creatorId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getViewerFollowingCreator(
  creatorId: string,
  viewerId?: string | null,
) {
  const supabase = await createServerSupabaseClient();

  if (!supabase || !viewerId || viewerId === creatorId) {
    return false;
  }

  const { data, error } = await supabase
    .from("creator_follows")
    .select("creator_id")
    .eq("follower_id", viewerId)
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}
