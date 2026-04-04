import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { listAdminProfileIds } from "@/lib/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AdminManagedUserRow, AdminUserManagementOverview } from "@/types";

async function getReadableAdminUserClient() {
  const serviceSupabase = createServiceRoleSupabaseClient();
  if (serviceSupabase) {
    return { supabase: serviceSupabase, hasServiceRole: true };
  }

  const serverSupabase = await createServerSupabaseClient();
  if (!serverSupabase) {
    throw new Error("Supabase is not configured.");
  }

  return { supabase: serverSupabase, hasServiceRole: false };
}

function getAdminWriteClient() {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("User management requires a valid SUPABASE_SERVICE_ROLE_KEY.");
  }

  return supabase;
}

export async function listAdminUsers(): Promise<AdminUserManagementOverview> {
  const { supabase, hasServiceRole } = await getReadableAdminUserClient();
  const adminProfileIds = hasServiceRole ? new Set(await listAdminProfileIds()) : new Set<string>();
  let warning: string | null = null;
  let canManageAuthUsers = hasServiceRole;

  if (!hasServiceRole) {
    warning = "User management is in read-only mode because SUPABASE_SERVICE_ROLE_KEY is not configured.";
  }

  const [{ data: profileRows, error: profilesError }, authResponse] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, handle, display_name, avatar_url, is_creator, is_public, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    hasServiceRole ? supabase.auth.admin.listUsers({ page: 1, perPage: 200 }) : Promise.resolve(null),
  ]);

  if (profilesError) {
    if (!hasServiceRole) {
      return {
        users: [],
        canManageAuthUsers: false,
        warning:
          warning ??
          "User management is unavailable until SUPABASE_SERVICE_ROLE_KEY is configured.",
      };
    }

    throw new Error(profilesError.message);
  }

  const profiles = profileRows ?? [];
  const profileIds = profiles.map((profile) => String(profile.id));
  const authUserMap = new Map(
    authResponse && !authResponse.error
      ? authResponse.data.users.map((user) => [user.id, user])
      : [],
  );

  if (authResponse?.error) {
    canManageAuthUsers = false;
    warning =
      warning ??
      "User management is partially unavailable because the service role key cannot access Supabase auth admin APIs.";
  }

  const { data: filmRows, error: filmsError } = profileIds.length
    ? await supabase
        .from("films")
        .select("id, creator_id, publish_status, visibility, moderation_status")
        .in("creator_id", profileIds)
    : { data: [], error: null };

  if (filmsError && hasServiceRole) {
    throw new Error(filmsError.message);
  }

  if (filmsError && !hasServiceRole) {
    warning = warning ?? "Read-only mode cannot load film totals without elevated database access.";
  }

  const filmCountMap = new Map();
  for (const film of filmRows ?? []) {
    if (
      film.publish_status === "published" &&
      film.visibility === "public" &&
      (film.moderation_status ?? "active") === "active"
    ) {
      filmCountMap.set(film.creator_id, (filmCountMap.get(film.creator_id) ?? 0) + 1);
    }
  }

  const users: AdminManagedUserRow[] = profiles.map((profile) => {
    const authUser = authUserMap.get(String(profile.id));

    return {
      id: String(profile.id),
      handle: String(profile.handle ?? ""),
      displayName: String(profile.display_name ?? ""),
      avatarUrl: typeof profile.avatar_url === "string" ? profile.avatar_url : null,
      isCreator: Boolean(profile.is_creator),
      isPublic: Boolean(profile.is_public),
      email: authUser?.email ?? null,
      createdAt: typeof profile.created_at === "string" ? profile.created_at : new Date(0).toISOString(),
      lastSignInAt: authUser?.last_sign_in_at ?? null,
      publicFilmCount: filmCountMap.get(String(profile.id)) ?? 0,
      isAdmin: adminProfileIds.has(String(profile.id)),
    };
  });

  return {
    users,
    canManageAuthUsers,
    warning,
  };
}

export async function deleteAdminManagedUsers(input: {
  actorUserId: string;
  userIds: string[];
}) {
  const supabase = getAdminWriteClient();
  const uniqueUserIds = [...new Set(input.userIds.map((value) => value.trim()).filter(Boolean))];

  if (uniqueUserIds.length === 0) {
    throw new Error("Select at least one user to remove.");
  }

  if (uniqueUserIds.includes(input.actorUserId)) {
    throw new Error("You cannot remove your own admin account.");
  }

  const adminProfileIds = new Set(await listAdminProfileIds());
  const protectedAdminIds = uniqueUserIds.filter((userId) => adminProfileIds.has(userId));

  if (protectedAdminIds.length > 0) {
    throw new Error("Admin accounts cannot be removed from this bulk action.");
  }

  const { data: existingProfiles, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .in("id", uniqueUserIds);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const existingIds = new Set((existingProfiles ?? []).map((profile) => String(profile.id)));
  const missingIds = uniqueUserIds.filter((userId) => !existingIds.has(userId));

  if (missingIds.length > 0) {
    throw new Error("One or more selected users could not be found.");
  }

  for (const userId of uniqueUserIds) {
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(error.message);
    }
  }

  return { deletedCount: uniqueUserIds.length };
}
