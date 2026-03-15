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
    const body = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: input.token,
    });

    if (input.ip && input.ip !== "unknown") {
      body.set("remoteip", input.ip);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
    });

    const payload = (await response.json()) as {
      success?: boolean;
      action?: string;
      ["error-codes"]?: string[];
    };

    if (!response.ok || !payload.success) {
      const errorCodes = payload["error-codes"] ?? [];

      console.error("Turnstile verification failed", {
        action: input.action,
        status: response.status,
        errorCodes,
      });

      if (errorCodes.includes("timeout-or-duplicate")) {
        return {
          ok: false as const,
          message: "The security check expired. Please try again.",
        };
      }

      if (errorCodes.includes("missing-input-response") || errorCodes.includes("invalid-input-response")) {
        return {
          ok: false as const,
          message: "Please complete the security check and try again.",
        };
      }

      if (errorCodes.includes("invalid-input-secret") || errorCodes.includes("missing-input-secret")) {
        return {
          ok: false as const,
          message: "The security check is unavailable right now. Please try again in a moment.",
        };
      }

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
    console.error("Turnstile verification request failed", {
      action: input.action,
    });

    return {
      ok: false as const,
      message: "We could not verify the security check. Please try again.",
    };
  }
}
