import { NextResponse } from "next/server";

import { CREATIVE_PROCESS_SUMMARY_LIMIT } from "@/lib/constants/process";
import { isValidHandle, mapProfile } from "@/lib/profiles";
import { normalizeTheatreSettings, THEATRE_OPENING_STATEMENT_LIMIT } from "@/lib/theatre";
import { moderateTextFields } from "@/lib/security/moderation";
import { enforceRateLimit, getRequestIp, rateLimitPresets } from "@/lib/security/rate-limit";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
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

  const ip = await getRequestIp();
  const rateLimit = await enforceRateLimit({
    ...rateLimitPresets.profile,
    key: `profile:${ip}:${user.id}`,
  });

  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status });
  }

  const payload = (await request.json()) as {
    handle?: string;
    display_name?: string;
    bio?: string | null;
    avatar_url?: string | null;
    banner_url?: string | null;
    website_url?: string | null;
    is_creator?: boolean;
    theatre_settings?: unknown;
  };

  const handle = payload.handle?.trim().toLowerCase() ?? "";
  const displayName = payload.display_name?.trim() ?? "";
  const theatreSettings = normalizeTheatreSettings(payload.theatre_settings);

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

  if (
    theatreSettings.openingStatement &&
    theatreSettings.openingStatement.length > THEATRE_OPENING_STATEMENT_LIMIT
  ) {
    return NextResponse.json(
      { error: `Opening Statement must be ${THEATRE_OPENING_STATEMENT_LIMIT} characters or fewer.` },
      { status: 400 },
    );
  }

  if (
    theatreSettings.creativeProcessSummary &&
    theatreSettings.creativeProcessSummary.length > CREATIVE_PROCESS_SUMMARY_LIMIT
  ) {
    return NextResponse.json(
      { error: `Creative Stack summary must be ${CREATIVE_PROCESS_SUMMARY_LIMIT} characters or fewer.` },
      { status: 400 },
    );
  }

  const moderation = await moderateTextFields([
    { label: "display_name", value: displayName },
    { label: "bio", value: payload.bio ?? null },
    { label: "opening_statement", value: theatreSettings.openingStatement },
    { label: "creative_process_summary", value: theatreSettings.creativeProcessSummary },
  ]);

  if (!moderation.ok) {
    return NextResponse.json({ error: moderation.message }, { status: 400 });
  }

  const profileQueryClient = createServiceRoleSupabaseClient() ?? supabase;
  const { data: conflictingProfile, error: conflictError } = await profileQueryClient
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .neq("id", user.id)
    .maybeSingle();

  if (conflictError) {
    return NextResponse.json({ error: conflictError.message }, { status: 400 });
  }

  if (conflictingProfile) {
    return NextResponse.json({ error: "That handle is already taken." }, { status: 409 });
  }

  const { data, error } = await supabase
    .rpc("upsert_own_profile", {
      p_handle: handle,
      p_display_name: displayName,
      p_bio: payload.bio ?? null,
      p_avatar_url: payload.avatar_url ?? null,
      p_banner_url: payload.banner_url ?? null,
      p_website_url: payload.website_url ?? null,
      p_is_creator: Boolean(payload.is_creator),
      p_theatre_settings: theatreSettings,
    })
    .single();

  if (error) {
    const message = error.message.toLowerCase();

    if (
      error.code === "23505" ||
      message.includes("profiles_handle_key") ||
      message.includes("duplicate key")
    ) {
      return NextResponse.json({ error: "That handle is already taken." }, { status: 409 });
    }

    if (message.includes("row-level security") || message.includes("row level security")) {
      return NextResponse.json(
        {
          error: "Profile update was blocked by row-level security. Verify that the upsert_own_profile database function has been applied in Supabase.",
        },
        { status: 403 },
      );
    }

    if (message.includes("unauthorized") || error.code === "42501") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile: mapProfile(data as Record<string, unknown>) });
}
