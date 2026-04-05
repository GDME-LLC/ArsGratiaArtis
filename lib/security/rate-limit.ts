import { headers } from "next/headers";

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
  message: string;
};

export const rateLimitPresets = {
  auth: { limit: 5, windowMs: 10 * 60 * 1000, message: "Too many sign-in attempts. Please wait a few minutes and try again." },
  comments: { limit: 8, windowMs: 10 * 60 * 1000, message: "You are commenting too quickly. Please wait a moment and try again." },
  reports: { limit: 5, windowMs: 60 * 60 * 1000, message: "Too many reports were submitted from this connection. Please try again later." },
  uploadInit: { limit: 10, windowMs: 60 * 60 * 1000, message: "Upload starts are temporarily limited. Please wait a few minutes and try again." },
  profile: { limit: 10, windowMs: 60 * 60 * 1000, message: "Profile changes are temporarily limited. Please wait a little and try again." },
  films: { limit: 20, windowMs: 60 * 60 * 1000, message: "Release edits are temporarily limited. Please wait a little and try again." },
  integrations: { limit: 5, windowMs: 60 * 60 * 1000, message: "Too many integration changes. Please wait a little and try again." },
  integrationSync: { limit: 15, windowMs: 60 * 60 * 1000, message: "Too many platform sync requests. Please wait a little and try again." },
} as const;

function getUpstashEnv() {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

export async function getRequestIp() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const realIp = headerStore.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return realIp || "unknown";
}

async function hitMemoryLimit(config: RateLimitConfig) {
  const now = Date.now();
  const current = memoryStore.get(config.key);

  if (!current || current.resetAt <= now) {
    memoryStore.set(config.key, { count: 1, resetAt: now + config.windowMs });
    return { ok: true, remaining: config.limit - 1, retryAfterMs: config.windowMs };
  }

  current.count += 1;
  memoryStore.set(config.key, current);

  return {
    ok: current.count <= config.limit,
    remaining: Math.max(0, config.limit - current.count),
    retryAfterMs: Math.max(1000, current.resetAt - now),
  };
}

async function hitUpstashLimit(config: RateLimitConfig) {
  const { url, token } = getUpstashEnv();

  if (!url || !token) {
    return hitMemoryLimit(config);
  }

  const key = `rate:${config.key}`;
  const incrementResponse = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!incrementResponse.ok) {
    return hitMemoryLimit(config);
  }

  const incrementPayload = (await incrementResponse.json()) as { result?: number };
  const count = Number(incrementPayload.result ?? 0);

  if (count === 1) {
    await fetch(`${url}/expire/${encodeURIComponent(key)}/${Math.ceil(config.windowMs / 1000)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }).catch(() => undefined);
  }

  const ttlResponse = await fetch(`${url}/pttl/${encodeURIComponent(key)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  }).catch(() => null);

  const ttlPayload = ttlResponse && ttlResponse.ok ? ((await ttlResponse.json()) as { result?: number }) : null;
  const retryAfterMs = Number(ttlPayload?.result ?? config.windowMs);

  return {
    ok: count <= config.limit,
    remaining: Math.max(0, config.limit - count),
    retryAfterMs: retryAfterMs > 0 ? retryAfterMs : config.windowMs,
  };
}

export async function enforceRateLimit(config: RateLimitConfig) {
  const result = await hitUpstashLimit(config);

  if (!result.ok) {
    return {
      ok: false as const,
      status: 429,
      message: config.message,
      retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000),
    };
  }

  return {
    ok: true as const,
    remaining: result.remaining,
  };
}


