import { NextResponse } from "next/server";

import { ensureProfileForUser, isValidHandle, mapProfile } from "@/lib/profiles";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

export async function PUT(request: Request) {
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

  await ensureProfileForUser(user);

  const payload = (await request.json()) as {
    handle?: string;
    display_name?: string;
    bio?: string | null;
    avatar_url?: string | null;
    banner_url?: string | null;
    website_url?: string | null;
    is_creator?: boolean;
  };

  const handle = payload.handle?.trim().toLowerCase() ?? "";
  const displayName = payload.display_name?.trim() ?? "";

  if (!isValidHandle(handle)) {
    return NextResponse.json(
      {
        error: "Handle must be 3-32 characters and use lowercase letters, numbers, or underscores.",
      },
      { status: 400 },
    );
  }

  if (!displayName) {
    return NextResponse.json({ error: "Display name is required." }, { status: 400 });
  }

  const { data: conflictingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .neq("id", user.id)
    .maybeSingle();

  if (conflictingProfile) {
    return NextResponse.json({ error: "That handle is already taken." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      handle,
      display_name: displayName,
      bio: payload.bio ?? null,
      avatar_url: payload.avatar_url ?? null,
      banner_url: payload.banner_url ?? null,
      website_url: payload.website_url ?? null,
      is_creator: Boolean(payload.is_creator),
    })
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile: mapProfile(data) });
}
