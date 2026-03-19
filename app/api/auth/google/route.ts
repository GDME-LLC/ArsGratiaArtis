import { NextResponse } from "next/server";

import { enforceRateLimit, getRequestIp, rateLimitPresets } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { getRequestOrigin } from "@/lib/request-origin";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

type GoogleAuthAction = "login" | "signup";

type GoogleAuthPayload = {
  turnstileToken?: string;
  action?: GoogleAuthAction;
};

function getAuthAction(value: string | null | undefined): GoogleAuthAction {
  return value === "signup" ? "signup" : "login";
}

function buildAuthRedirect(origin: string, action: GoogleAuthAction, error: string) {
  const url = new URL(action === "signup" ? "/signup" : "/login", origin);
  url.searchParams.set("message", error);
  return NextResponse.redirect(url);
}

async function startGoogleAuth(request: Request, input: GoogleAuthPayload) {
  const action = getAuthAction(input.action);

  if (!hasSupabaseServerEnv()) {
    const error = "Authentication is not configured right now.";
    return {
      error,
      response: NextResponse.json({ error }, { status: 503 }),
      redirect: buildAuthRedirect(getRequestOrigin(request), action, error),
    };
  }

  const ip = await getRequestIp();
  const rateLimit = await enforceRateLimit({
    ...rateLimitPresets.auth,
    key: `auth:google:${action}:${ip}`,
  });

  if (!rateLimit.ok) {
    return {
      error: rateLimit.message,
      response: NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status }),
      redirect: buildAuthRedirect(getRequestOrigin(request), action, rateLimit.message),
    };
  }

  const turnstile = await verifyTurnstileToken({
    token: input.turnstileToken,
    ip,
    action,
  });

  if (!turnstile.ok) {
    return {
      error: turnstile.message,
      response: NextResponse.json({ error: turnstile.message }, { status: 400 }),
      redirect: buildAuthRedirect(getRequestOrigin(request), action, turnstile.message),
    };
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    const error = "Authentication is not configured right now.";
    return {
      error,
      response: NextResponse.json({ error }, { status: 503 }),
      redirect: buildAuthRedirect(getRequestOrigin(request), action, error),
    };
  }

  const origin = getRequestOrigin(request);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      skipBrowserRedirect: true,
    },
  });

  const authUrl = data?.url;
  const authError = error?.message || (!authUrl ? "Google sign-in could not be started." : null);

  if (authError || !authUrl) {
    return {
      error: authError ?? "Google sign-in could not be started.",
      response: NextResponse.json({ error: authError ?? "Google sign-in could not be started." }, { status: 400 }),
      redirect: buildAuthRedirect(origin, action, authError ?? "Google sign-in could not be started."),
    };
  }

  return {
    error: null,
    response: NextResponse.json({ ok: true, url: authUrl }),
    redirect: NextResponse.redirect(authUrl),
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const result = await startGoogleAuth(request, {
    turnstileToken: requestUrl.searchParams.get("turnstileToken") ?? undefined,
    action: getAuthAction(requestUrl.searchParams.get("action")),
  });

  return result.redirect;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as GoogleAuthPayload | null;
  const result = await startGoogleAuth(request, {
    turnstileToken: payload?.turnstileToken,
    action: getAuthAction(payload?.action),
  });

  return result.response;
}
