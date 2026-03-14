import { NextResponse } from "next/server";

import { ensureProfileForUser } from "@/lib/profiles";
import { moderateTextFields } from "@/lib/security/moderation";
import { enforceRateLimit, getRequestIp, rateLimitPresets } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

const ALLOWED_REPORT_REASONS = [
  "copyright issue",
  "abusive content",
  "spam",
  "impersonation",
  "other",
] as const;

type ReportReason = (typeof ALLOWED_REPORT_REASONS)[number];

type ReportPayload = {
  targetType?: "film" | "creator";
  slug?: string;
  handle?: string;
  reason?: ReportReason;
  details?: string;
  turnstileToken?: string;
};

async function resolveTargetId(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
  payload: ReportPayload,
) {
  if (payload.targetType === "creator") {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", payload.handle ?? "")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return { targetId: data?.id ?? null, targetType: "profile" as const };
  }

  const { data, error } = await supabase
    .from("films")
    .select("id")
    .eq("slug", payload.slug ?? "")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return { targetId: data?.id ?? null, targetType: "film" as const };
}

export async function POST(request: Request) {
  if (!hasSupabaseServerEnv()) {
    return NextResponse.json({ error: "Reporting is not configured right now." }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Reporting is not configured right now." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in to submit a report." }, { status: 401 });
  }

  const profile = await ensureProfileForUser(user);

  if (!profile) {
    return NextResponse.json({ error: "Profile unavailable." }, { status: 400 });
  }

  const payload = (await request.json().catch(() => null)) as ReportPayload | null;
  const ip = await getRequestIp();

  const rateLimit = await enforceRateLimit({
    ...rateLimitPresets.reports,
    key: `reports:${ip}:${profile.id}`,
  });

  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status });
  }

  const turnstile = await verifyTurnstileToken({
    token: payload?.turnstileToken,
    ip,
    action: "report",
  });

  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.message }, { status: 400 });
  }

  const reason = payload?.reason;
  const details = payload?.details?.trim() ?? "";

  if (!reason || !ALLOWED_REPORT_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Choose a report reason." }, { status: 400 });
  }

  const moderation = await moderateTextFields([{ label: "report_details", value: details }]);

  if (!moderation.ok) {
    return NextResponse.json({ error: moderation.message }, { status: 400 });
  }

  const target = await resolveTargetId(supabase, payload ?? {});

  if (!target.targetId) {
    return NextResponse.json({ error: "The report target could not be found." }, { status: 404 });
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: profile.id,
    target_type: target.targetType,
    target_id: target.targetId,
    reason,
    details: details || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (target.targetType === "film") {
    await supabase
      .from("films")
      .update({
        moderation_status: "pending_review",
        moderation_reason: `Reported for ${reason}`,
      })
      .eq("id", target.targetId)
      .in("moderation_status", ["active", "pending_review"]);
  }

  return NextResponse.json({ ok: true });
}
