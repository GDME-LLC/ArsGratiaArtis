import { createServerSupabaseClient } from "@/lib/supabase/server";

export type NotificationItem = {
  id: string;
  type: "like" | "comment" | "follow" | "staff_pick" | "featured" | "admin_report_film" | "admin_report_profile";
  entityId: string;
  createdAt: string;
  read: boolean;
  message: string;
  href: string;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationItem["type"];
  entity_id: string;
  created_at: string;
  read: boolean;
};

function isMissingRelationError(error: { message?: string } | null) {
  return Boolean(error?.message?.toLowerCase().includes("notifications"));
}

export async function listNotificationsForUser(userId: string, limit = 10): Promise<NotificationItem[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, entity_id, created_at, read")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingRelationError(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  const rows = (data ?? []) as NotificationRow[];

  if (rows.length === 0) {
    return [];
  }

  const filmIds = [...new Set(rows.filter((row) => row.type !== "follow" && row.type !== "admin_report_profile").map((row) => row.entity_id))];
  const profileIds = [...new Set(rows.filter((row) => row.type === "follow" || row.type === "admin_report_profile").map((row) => row.entity_id))];

  const filmMap = new Map<string, { title: string; slug: string }>();
  const profileMap = new Map<string, { handle: string; displayName: string }>();

  if (filmIds.length > 0) {
    const { data: films, error: filmsError } = await supabase
      .from("films")
      .select("id, title, slug")
      .in("id", filmIds);

    if (filmsError) {
      throw new Error(filmsError.message);
    }

    for (const film of films ?? []) {
      filmMap.set(film.id, {
        title: String(film.title),
        slug: String(film.slug),
      });
    }
  }

  if (profileIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, handle, display_name")
      .in("id", profileIds);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    for (const profile of profiles ?? []) {
      profileMap.set(profile.id, {
        handle: String(profile.handle),
        displayName: String(profile.display_name ?? ""),
      });
    }
  }

  return rows.map((row) => {
    if (row.type === "follow") {
      const follower = profileMap.get(row.entity_id);
      const followerName = follower?.displayName || (follower ? `@${follower.handle}` : "A creator");

      return {
        id: row.id,
        type: row.type,
        entityId: row.entity_id,
        createdAt: row.created_at,
        read: row.read,
        message: `${followerName} followed your filmmaker page.`,
        href: follower ? `/creator/${follower.handle}` : "/dashboard",
      };
    }

    if (row.type === "admin_report_profile") {
      const profile = profileMap.get(row.entity_id);
      const profileLabel = profile?.displayName || (profile ? `@${profile.handle}` : "a user");

      return {
        id: row.id,
        type: row.type,
        entityId: row.entity_id,
        createdAt: row.created_at,
        read: row.read,
        message: `A profile was reported: ${profileLabel}.`,
        href: profile ? `/creator/${profile.handle}` : "/admin/films",
      };
    }

    const film = filmMap.get(row.entity_id);
    const filmTitle = film?.title ?? "your release";
    const href = film ? `/film/${film.slug}` : "/dashboard";

    if (row.type === "comment") {
      return {
        id: row.id,
        type: row.type,
        entityId: row.entity_id,
        createdAt: row.created_at,
        read: row.read,
        message: `Your film ${filmTitle} received a new comment.`,
        href,
      };
    }

    if (row.type === "staff_pick") {
      return {
        id: row.id,
        type: row.type,
        entityId: row.entity_id,
        createdAt: row.created_at,
        read: row.read,
        message: `Your film ${filmTitle} was added to Staff Picks.`,
        href,
      };
    }

    if (row.type === "featured") {
      return {
        id: row.id,
        type: row.type,
        entityId: row.entity_id,
        createdAt: row.created_at,
        read: row.read,
        message: `Your film ${filmTitle} was featured on ArsGratia.`,
        href,
      };
    }

    if (row.type === "admin_report_film") {
      return {
        id: row.id,
        type: row.type,
        entityId: row.entity_id,
        createdAt: row.created_at,
        read: row.read,
        message: `A film was reported: ${filmTitle}.`,
        href: film ? `/film/${film.slug}` : "/admin/films",
      };
    }

    return {
      id: row.id,
      type: row.type,
      entityId: row.entity_id,
      createdAt: row.created_at,
      read: row.read,
      message: `Your film ${filmTitle} received a new like.`,
      href,
    };
  });
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    if (isMissingRelationError(error)) {
      return 0;
    }

    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function markNotificationsReadForUser(userId: string, ids?: string[]) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  let query = supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  }

  const { error } = await query;

  if (error) {
    if (isMissingRelationError(error)) {
      return;
    }

    throw new Error(error.message);
  }
}