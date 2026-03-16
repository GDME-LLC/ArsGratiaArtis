export function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }

  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;

  if (envUrl) {
    try {
      return new URL(envUrl).origin;
    } catch {
      // Ignore invalid env values and fall through to request.url.
    }
  }

  const vercelUrl = process.env.VERCEL_URL;

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return new URL(request.url).origin;
}
