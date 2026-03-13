const MUX_API_BASE = "https://api.mux.com/video/v1";

type MuxUploadStatus = "waiting" | "asset_created" | "errored" | "cancelled" | "timed_out";
type MuxAssetStatus = "preparing" | "ready" | "errored";

type MuxDirectUploadResponse = {
  id: string;
  url: string;
  status: MuxUploadStatus;
  asset_id?: string;
};

type MuxAssetResponse = {
  id: string;
  status: MuxAssetStatus;
  playback_ids?: Array<{
    id: string;
    policy: "public" | "signed" | "drm";
  }>;
};

function getMuxEnv() {
  return {
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  };
}

export function hasMuxEnv() {
  const { tokenId, tokenSecret } = getMuxEnv();

  return Boolean(tokenId && tokenSecret);
}

function getMuxAuthHeader() {
  const { tokenId, tokenSecret } = getMuxEnv();

  if (!tokenId || !tokenSecret) {
    throw new Error("Mux is not configured in this environment.");
  }

  const encoded = Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64");

  return `Basic ${encoded}`;
}

async function muxRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${MUX_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: getMuxAuthHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: { message?: string } }
    | null;

  if (!response.ok || !payload?.data) {
    throw new Error(payload?.error?.message || "Mux request failed.");
  }

  return payload.data;
}

export async function createMuxDirectUpload(input: {
  corsOrigin?: string | null;
  passthrough: string;
}) {
  const data = await muxRequest<MuxDirectUploadResponse>("/uploads", {
    method: "POST",
    body: JSON.stringify({
      cors_origin: input.corsOrigin || undefined,
      new_asset_settings: {
        playback_policies: ["public"],
        video_quality: "basic",
        passthrough: input.passthrough,
      },
    }),
  });

  return {
    uploadId: data.id,
    uploadUrl: data.url,
    status: data.status,
  };
}

export async function getMuxDirectUpload(uploadId: string) {
  return muxRequest<MuxDirectUploadResponse>(`/uploads/${uploadId}`);
}

export async function getMuxAsset(assetId: string) {
  return muxRequest<MuxAssetResponse>(`/assets/${assetId}`);
}
