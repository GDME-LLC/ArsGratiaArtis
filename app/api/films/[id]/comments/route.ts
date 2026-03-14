import { NextResponse } from "next/server";

import { moderateTextFields } from "@/lib/security/moderation";
import { enforceRateLimit, getRequestIp, rateLimitPresets } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

type FilmCommentsRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: FilmCommentsRouteProps) {
  if (!hasSupabaseServerEnv()) {
    return NextResponse.json(
      { error: "Supabase is not configured in this environment." },
      { status: 503 },
    );
  }

  const { id } = await params;
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

  const payload = (await request.json().catch(() => null)) as { body?: string; turnstileToken?: string } | null;
  const ip = await getRequestIp();

  const rateLimit = await enforceRateLimit({
    ...rateLimitPresets.comments,
    key: `comments:${ip}:${user.id}:${id}`,
  });

  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status });
  }

  const turnstile = await verifyTurnstileToken({
    token: payload?.turnstileToken,
    ip,
    action: "comment",
  });

  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.message }, { status: 400 });
  }

  const { data: film, error: filmError } = await supabase
    .from("films")
    .select("id")
    .eq("id", id)
    .eq("publish_status", "published")
    .eq("visibility", "public")
    .eq("moderation_status", "active")
    .maybeSingle();

  if (filmError) {
    return NextResponse.json({ error: filmError.message }, { status: 400 });
  }

  if (!film) {
    return NextResponse.json(
      { error: "Comments can only be added to published public films." },
      { status: 404 },
    );
  }

  const body = payload?.body?.trim() ?? "";

  if (!body) {
    return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
  }

  if (body.length > 5000) {
    return NextResponse.json(
      { error: "Comment must be 5000 characters or fewer." },
      { status: 400 },
    );
  }

  const moderation = await moderateTextFields([{ label: "comment", value: body }]);

  if (!moderation.ok) {
    return NextResponse.json({ error: moderation.message }, { status: 400 });
  }

  const { error } = await supabase.from("comments").insert({
    film_id: id,
    author_id: user.id,
    body,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
