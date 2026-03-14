import { NextResponse } from "next/server";

import { markNotificationsReadForUser } from "@/lib/services/notifications";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

type NotificationReadPayload = {
  ids?: string[];
};

export async function POST(request: Request) {
  if (!hasSupabaseServerEnv()) {
    return NextResponse.json(
      { error: "Supabase is not configured in this environment." },
      { status: 503 },
    );
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase client unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as NotificationReadPayload;
  const ids = Array.isArray(payload.ids)
    ? payload.ids.filter((value): value is string => typeof value === "string" && value.length > 0)
    : undefined;

  await markNotificationsReadForUser(user.id, ids);

  return NextResponse.json({ ok: true });
}
