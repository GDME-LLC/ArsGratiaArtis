import { NextResponse } from "next/server";

import { ensureProfileForUser } from "@/lib/profiles";
import {
  attachMuxAssetToDraftFilm,
  getDraftFilmOwnership,
} from "@/lib/services/films";
import {
  createServerSupabaseClient,
  hasSupabaseServerEnv,
} from "@/lib/supabase/server";
import {
  validateVideoUploadMetadata,
} from "@/lib/films/upload";
import { enforceRateLimit, getRequestIp, rateLimitPresets } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import {
  createMuxDirectUpload,
  getMuxAsset,
  getMuxDirectUpload,
  hasMuxEnv,
} from "@/lib/mux";

type VideoUploadRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

async function requireDraftFilmAccess(filmId: string) {
  if (!hasSupabaseServerEnv()) {
    return { error: NextResponse.json({ error: "Supabase is not configured in this environment." }, { status: 503 }) };
  }

  if (!hasMuxEnv()) {
    return { error: NextResponse.json({ error: "Mux is not configured in this environment." }, { status: 503 }) };
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return { error: NextResponse.json({ error: "Supabase client unavailable." }, { status: 503 }) };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  const profile = await ensureProfileForUser(user);

  if (!profile) {
    return { error: NextResponse.json({ error: "Profile unavailable." }, { status: 400 }) };
  }

  if (!profile.isCreator) {
    return {
      error: NextResponse.json(
        { error: "Enable creator mode in settings before uploading video." },
        { status: 403 },
      ),
    };
  }

  const film = await getDraftFilmOwnership(filmId, profile.id);

  if (!film) {
    return {
      error: NextResponse.json(
        { error: "Only creators can upload video to their own draft films." },
        { status: 404 },
      ),
    };
  }

  return { profile, film };
}

export async function POST(request: Request, { params }: VideoUploadRouteProps) {
  const { id } = await params;
  const access = await requireDraftFilmAccess(id);

  if ("error" in access) {
    return access.error;
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      fileSize?: number;
      fileName?: string;
      fileType?: string;
      turnstileToken?: string;
    } | null;
    const ip = await getRequestIp();

    const rateLimit = await enforceRateLimit({
      ...rateLimitPresets.uploadInit,
      key: `upload-init:${ip}:${access.profile.id}`,
    });

    if (!rateLimit.ok) {
      return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status });
    }

    const turnstile = await verifyTurnstileToken({
      token: body?.turnstileToken,
      ip,
      action: "upload",
    });

    if (!turnstile.ok) {
      return NextResponse.json({ error: turnstile.message }, { status: 400 });
    }

    const uploadValidation = validateVideoUploadMetadata({
      fileSize: body?.fileSize ?? null,
      fileName: body?.fileName ?? null,
      fileType: body?.fileType ?? null,
    });

    if (!uploadValidation.ok) {
      return NextResponse.json({ error: uploadValidation.message }, { status: 400 });
    }

    const upload = await createMuxDirectUpload({
      corsOrigin: request.headers.get("origin"),
      passthrough: id,
    });

    return NextResponse.json(upload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload URL could not be created." },
      { status: 400 },
    );
  }
}

export async function GET(request: Request, { params }: VideoUploadRouteProps) {
  const { id } = await params;
  const access = await requireDraftFilmAccess(id);

  if ("error" in access) {
    return access.error;
  }

  const uploadId = new URL(request.url).searchParams.get("uploadId");

  if (!uploadId) {
    return NextResponse.json({ error: "uploadId is required." }, { status: 400 });
  }

  try {
    const upload = await getMuxDirectUpload(uploadId);

    if (upload.status !== "asset_created" || !upload.asset_id) {
      return NextResponse.json({
        uploadStatus: upload.status,
        assetStatus: null,
        muxAssetId: access.film.muxAssetId,
        muxPlaybackId: access.film.muxPlaybackId,
      });
    }

    const asset = await getMuxAsset(upload.asset_id);
    const publicPlaybackId =
      asset.playback_ids?.find((playbackId) => playbackId.policy === "public")?.id ?? null;

    const updatedFilm = await attachMuxAssetToDraftFilm({
      filmId: access.film.id,
      creatorId: access.profile.id,
      muxAssetId: asset.id,
      muxPlaybackId: publicPlaybackId,
    });

    return NextResponse.json({
      uploadStatus: upload.status,
      assetStatus: asset.status,
      muxAssetId: updatedFilm.muxAssetId,
      muxPlaybackId: updatedFilm.muxPlaybackId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload status could not be loaded." },
      { status: 400 },
    );
  }
}
