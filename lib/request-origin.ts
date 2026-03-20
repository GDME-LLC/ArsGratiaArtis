function getConfiguredSiteOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;

  if (!configuredUrl) {
    return null;
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return null;
  }
}

export function getRequestOrigin(request: Request) {
  const configuredOrigin = getConfiguredSiteOrigin();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }

  const vercelUrl = process.env.VERCEL_URL;

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return new URL(request.url).origin;
}

export function getAuthCallbackUrl(request: Request) {
  return `${getRequestOrigin(request)}/auth/callback`;
}
