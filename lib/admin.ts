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

export async function getAdminUser() {
  const user = await getUser();

  if (!user || !isAdminEmail(user.email)) {
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
