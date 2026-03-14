import { NextResponse } from "next/server";

import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import { enforceRateLimit, getRequestIp, rateLimitPresets } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

type SignupPayload = {
  email?: string;
  password?: string;
  turnstileToken?: string;
};

export async function POST(request: Request) {
  if (!hasSupabaseServerEnv()) {
    return NextResponse.json({ error: "Authentication is not configured right now." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => null)) as SignupPayload | null;
  const email = payload?.email?.trim().toLowerCase() ?? "";
  const password = payload?.password ?? "";
  const ip = await getRequestIp();

  const rateLimit = await enforceRateLimit({
    ...rateLimitPresets.auth,
    key: `auth:signup:${ip}:${email || "unknown"}`,
  });

  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status });
  }

  const turnstile = await verifyTurnstileToken({
    token: payload?.turnstileToken,
    ip,
    action: "signup",
  });

  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.message }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Authentication is not configured right now." }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    redirectTo: data.session ? "/dashboard" : undefined,
    message: data.session
      ? undefined
      : "Check your email to confirm your account. Creator publishing access is enabled separately.",
  });
}
