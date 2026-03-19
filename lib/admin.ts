import type { User } from "@supabase/supabase-js";

import { getUser } from "@/lib/supabase/auth";

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

export async function getAdminUser() {
  const user = await getUser();

  if (!user) {
    return null;
  }

  const isAdmin = getUserEmailCandidates(user).some((email) => isAdminEmail(email));

  if (!isAdmin) {
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
