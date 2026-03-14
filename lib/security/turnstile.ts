const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function getTurnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
}

export function hasTurnstileEnv() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstileToken(input: {
  token?: string | null;
  ip?: string | null;
  action: string;
}) {
  if (!process.env.TURNSTILE_SECRET_KEY || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    if (process.env.NODE_ENV !== "production") {
      return { ok: true as const };
    }

    return {
      ok: false as const,
      message: "The security check is unavailable right now. Please try again in a moment.",
    };
  }

  if (!input.token) {
    return {
      ok: false as const,
      message: "Please complete the security check and try again.",
    };
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: input.token,
        remoteip: input.ip ?? undefined,
      }),
      cache: "no-store",
    });

    const payload = (await response.json()) as {
      success?: boolean;
      action?: string;
    };

    if (!response.ok || !payload.success) {
      return {
        ok: false as const,
        message: "We could not verify the security check. Please try again.",
      };
    }

    if (payload.action && payload.action !== input.action) {
      return {
        ok: false as const,
        message: "The security check expired. Please try again.",
      };
    }

    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      message: "We could not verify the security check. Please try again.",
    };
  }
}
