import { NextResponse } from "next/server";

import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import { enforceRateLimit, getRequestIp, rateLimitPresets } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

type LoginPayload = {
  email?: string;
  password?: string;
  turnstileToken?: string;
};

export async function POST(request: Request) {
  if (!hasSupabaseServerEnv()) {
    return NextResponse.json({ error: "Authentication is not configured right now." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => null)) as LoginPayload | null;
  const email = payload?.email?.trim().toLowerCase() ?? "";
  const password = payload?.password ?? "";
  const ip = await getRequestIp();

  const rateLimit = await enforceRateLimit({
    ...rateLimitPresets.auth,
    key: `auth:login:${ip}:${email || "unknown"}`,
  });

  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status });
  }

  const turnstile = await verifyTurnstileToken({
    token: payload?.turnstileToken,
    ip,
    action: "login",
  });

  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.message }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Authentication is not configured right now." }, { status: 503 });
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
}
