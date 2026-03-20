import { NextResponse } from "next/server";

import { enforceRateLimit, getRequestIp, rateLimitPresets } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { getAuthCallbackUrl } from "@/lib/request-origin";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

type GoogleAuthPayload = {
  turnstileToken?: string;
  action?: "login" | "signup";
};

export async function POST(request: Request) {
  if (!hasSupabaseServerEnv()) {
    return NextResponse.json({ error: "Authentication is not configured right now." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => null)) as GoogleAuthPayload | null;
  const ip = await getRequestIp();
  const turnstileAction = payload?.action === "signup" ? "signup" : "login";

  const rateLimit = await enforceRateLimit({
    ...rateLimitPresets.auth,
    key: `auth:google:${turnstileAction}:${ip}`,
  });

  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status });
  }

  const turnstile = await verifyTurnstileToken({
    token: payload?.turnstileToken,
    ip,
    action: turnstileAction,
  });

  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.message }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Authentication is not configured right now." }, { status: 503 });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(request),
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return NextResponse.json({ error: error?.message || "Google sign-in could not be started." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, url: data.url });
}
