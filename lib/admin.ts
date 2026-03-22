import type { User } from "@supabase/supabase-js";

import { getUser } from "@/lib/supabase/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

function getConfiguredAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getConfiguredAdminEmails().includes(email.trim().toLowerCase());
}

function getUserEmailCandidates(user: User) {
  const identityEmails = (user.identities ?? [])
    .map((identity) => {
      const identityData = identity.identity_data as Record<string, unknown> | null | undefined;
      return typeof identityData?.email === "string" ? identityData.email : null;
    })
    .filter((value): value is string => Boolean(value));

  const metadataEmail =
    typeof user.user_metadata?.email === "string" ? user.user_metadata.email : null;

  return [user.email, metadataEmail, ...identityEmails]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim().toLowerCase());
}

export async function isAdminProfileId(profileId: string | null | undefined) {
  if (!profileId) {
    return false;
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("profile_id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data?.profile_id);
}

export async function hasAdminAccess(user: User | null | undefined) {
  if (!user) {
    return false;
  }

  if (await isAdminProfileId(user.id)) {
    return true;
  }

  return getUserEmailCandidates(user).some((email) => isAdminEmail(email));
}

export async function getAdminUser() {
  const user = await getUser();

  if (!(await hasAdminAccess(user))) {
    return null;
  }

  return user;
}

export async function requireAdminUser() {
  const user = await getAdminUser();

  if (!user) {
    throw new Error("Admin access required.");
  }

  return user;
}
