import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import type { AdminFilmAction, AdminFilmRow } from "@/types";

function getAdminFilmStorageClient() {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  return supabase;
}

export async function listAdminFilms(limit = 40): Promise<AdminFilmRow[]> {
  const supabase = getAdminFilmStorageClient();
  const pageSize = Math.min(100, Math.max(1, limit));

  const { data: films, error } = await supabase
    .from("films")
    .select("id, title, slug, synopsis, poster_url, publish_status, visibility, moderation_status, created_at, updated_at, published_at, creator_id")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(pageSize);

  if (error) {
    throw new Error(error.message);
  }

  const creatorIds = [...new Set((films ?? []).map((film) => film.creator_id))];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, handle, display_name")
    .in("id", creatorIds);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      {
        handle: String(profile.handle ?? ""),
        displayName: String(profile.display_name ?? ""),
      },
    ]),
  );

  return (films ?? []).map((film) => ({
    id: film.id,
    title: film.title,
    slug: film.slug,
    synopsis: film.synopsis,
    posterUrl: film.poster_url ?? null,
    publishStatus: film.publish_status,
    visibility: film.visibility,
    moderationStatus: film.moderation_status ?? "active",
    createdAt: film.created_at,
    updatedAt: film.updated_at,
    publishedAt: film.published_at ?? null,
    creator: profileMap.get(film.creator_id) ?? {
      handle: "",
      displayName: "Unknown creator",
    },
  }));
}

export async function updateAdminFilmAction(input: {
  filmId: string;
  action: AdminFilmAction;
  adminUserId: string;
}) {
  const supabase = getAdminFilmStorageClient();

  const nextValues =
    input.action === "hide"
      ? {
          visibility: "private" as const,
          reviewed_at: new Date().toISOString(),
          reviewed_by: input.adminUserId,
        }
      : {
          publish_status: "draft" as const,
          published_at: null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: input.adminUserId,
        };

  const { error } = await supabase
    .from("films")
    .update(nextValues)
    .eq("id", input.filmId);

  if (error) {
    throw new Error(error.message);
  }
}
