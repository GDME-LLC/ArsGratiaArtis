import type { Session, User } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getSession(): Promise<Session | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

export async function getUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
