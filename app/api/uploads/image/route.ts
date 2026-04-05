import { NextResponse } from "next/server";

import { ensureProfileForUser } from "@/lib/profiles";
import {
  buildMediaObjectPath,
  buildWorkflowAssetObjectPath,
  extractStorageObjectPathFromUrl,
  getImageUploadError,
  getMediaBucketName,
  getWorkflowAssetUploadError,
  isAllowedWorkflowAssetMimeType,
} from "@/lib/media/storage";
import { addWorkflowUploadAsset } from "@/lib/services/workflow-assets";
import { getCreatorWorkflowDraftById } from "@/lib/services/workflows";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import type { WorkflowAssetSourceType } from "@/types";

const ALLOWED_WORKFLOW_ASSET_SOURCE_TYPES: WorkflowAssetSourceType[] = ["runway", "elevenlabs", "generic"];

export async function POST(request: Request) {
  if (!hasSupabaseServerEnv()) {
    return NextResponse.json(
      { error: "Supabase is not configured in this environment." },
      { status: 503 },
    );
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase client unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const sub = url.searchParams.get("_sub");

  if (sub === "workflow-asset") {
    const profile = await ensureProfileForUser(user);

    if (!profile) {
      return NextResponse.json({ error: "Profile unavailable." }, { status: 400 });
    }

    if (!profile.isCreator) {
      return NextResponse.json({ error: "Creator mode is required for workflow asset uploads." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const draftId = formData.get("draftId");
    const label = formData.get("label");
    const sourceType = (formData.get("sourceType") ?? "generic") as WorkflowAssetSourceType;
    const stage = formData.get("stage");
    const notes = formData.get("notes");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Asset file is required." }, { status: 400 });
    }

    if (typeof draftId !== "string" || !draftId.trim()) {
      return NextResponse.json({ error: "Draft ID is required." }, { status: 400 });
    }

    const labelStr = typeof label === "string" ? label.trim() : "";

    if (!labelStr || labelStr.length > 120) {
      return NextResponse.json({ error: "Asset label is required and must be 120 characters or fewer." }, { status: 400 });
    }

    if (!ALLOWED_WORKFLOW_ASSET_SOURCE_TYPES.includes(sourceType)) {
      return NextResponse.json({ error: "Source type is invalid." }, { status: 400 });
    }

    if (!isAllowedWorkflowAssetMimeType(file.type)) {
      return NextResponse.json({ error: "Upload a JPG, PNG, WebP image, MP3/WAV/OGG/M4A audio, or MP4/MOV/WebM video file." }, { status: 400 });
    }

    const uploadError = getWorkflowAssetUploadError(file.type, file.size);

    if (uploadError) {
      return NextResponse.json({ error: uploadError }, { status: 400 });
    }

    const draft = await getCreatorWorkflowDraftById(draftId, profile.id);

    if (!draft) {
      return NextResponse.json({ error: "Workflow draft not found." }, { status: 404 });
    }

    const bucketName = getMediaBucketName();
    const objectPath = buildWorkflowAssetObjectPath({
      userId: user.id,
      draftId: draftId.trim(),
      fileName: file.name,
      mimeType: file.type,
    });

    const serviceRoleSupabase = createServiceRoleSupabaseClient();
    const writeClients = [serviceRoleSupabase, supabase].filter(Boolean) as typeof supabase[];

    let uploadSucceeded = false;
    let activeStorageClient: typeof supabase | null = null;
    let lastError = "Asset upload failed.";

    for (const client of writeClients) {
      const { error } = await client.storage
        .from(bucketName)
        .upload(objectPath, file, { contentType: file.type, upsert: false });

      if (!error) {
        uploadSucceeded = true;
        activeStorageClient = client;
        break;
      }

      lastError = error.message;
    }

    if (!uploadSucceeded || !activeStorageClient) {
      return NextResponse.json({ error: lastError }, { status: 400 });
    }

    const { data } = activeStorageClient.storage.from(bucketName).getPublicUrl(objectPath);

    try {
      const asset = await addWorkflowUploadAsset({
        draftId: draftId.trim(),
        creatorId: profile.id,
        label: labelStr,
        url: data.publicUrl,
        filePath: objectPath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        sourceType,
        stage: typeof stage === "string" ? stage.trim() || null : null,
        notes: typeof notes === "string" ? notes.trim() || null : null,
      });

      return NextResponse.json({ asset, url: data.publicUrl, path: objectPath });
    } catch (error) {
      await activeStorageClient.storage.from(bucketName).remove([objectPath]);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Workflow asset record could not be saved." },
        { status: 400 },
      );
    }
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const entityType = formData.get("entityType");
  const field = formData.get("field");
  const filmId = formData.get("filmId");
  const existingUrl = formData.get("existingUrl");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required." }, { status: 400 });
  }

  if (entityType !== "film" && entityType !== "profile") {
    return NextResponse.json({ error: "Upload target is invalid." }, { status: 400 });
  }

  if (field !== "poster" && field !== "avatar" && field !== "banner" && field !== "hero") {
    return NextResponse.json({ error: "Upload field is invalid." }, { status: 400 });
  }

  if (entityType === "film" && field !== "poster") {
    return NextResponse.json({ error: "Only film posters can be uploaded here." }, { status: 400 });
  }

  if (entityType === "profile" && field === "poster") {
    return NextResponse.json({ error: "Profile uploads must be avatar or banner images." }, { status: 400 });
  }

  const uploadError = getImageUploadError(file.type, file.size);

  if (uploadError) {
    return NextResponse.json({ error: uploadError }, { status: 400 });
  }

  if (entityType === "film") {
    const profile = await ensureProfileForUser(user);

    if (!profile) {
      return NextResponse.json({ error: "Profile unavailable." }, { status: 400 });
    }

    if (!profile.isCreator) {
      return NextResponse.json({ error: "Creator mode is required for poster uploads." }, { status: 403 });
    }

    if (typeof filmId === "string" && filmId.trim()) {
      const { data: film, error } = await supabase
        .from("films")
        .select("id")
        .eq("id", filmId)
        .eq("creator_id", profile.id)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (!film) {
        return NextResponse.json({ error: "Film not found for this creator." }, { status: 404 });
      }
    }
  }

  const bucketName = getMediaBucketName();
  const objectPath = buildMediaObjectPath({
    userId: user.id,
    entityType,
    field,
    fileName: file.name,
    mimeType: file.type,
  });

  const writeClients: Array<typeof supabase> = [];
  const serviceRoleSupabase = createServiceRoleSupabaseClient();

  if (serviceRoleSupabase) {
    writeClients.push(serviceRoleSupabase);
  }

  writeClients.push(supabase);
  let uploadErrorMessage = "Image upload failed.";
  let uploadBlockedByRls = false;
  let uploadSucceeded = false;
  let activeStorageClient: (typeof supabase) | null = null;

  for (const client of writeClients) {
    const { error } = await client.storage
      .from(bucketName)
      .upload(objectPath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (!error) {
      uploadSucceeded = true;
      activeStorageClient = client;
      break;
    }

    uploadErrorMessage = error.message;
    const message = error.message.toLowerCase();

    if (message.includes("row-level security") || message.includes("row level security")) {
      uploadBlockedByRls = true;
      continue;
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!uploadSucceeded || !activeStorageClient) {
    if (uploadBlockedByRls) {
      return NextResponse.json(
        {
          error: "Image upload was blocked by Storage RLS. Apply the media bucket storage policies for authenticated users under users/<auth.uid()>/...",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ error: uploadErrorMessage }, { status: 400 });
  }

  if (typeof existingUrl === "string" && existingUrl.trim()) {
    const existingPath = extractStorageObjectPathFromUrl(existingUrl, bucketName);

    if (existingPath?.startsWith(`users/${user.id.toLowerCase()}/`)) {
      await activeStorageClient.storage.from(bucketName).remove([existingPath]);
    }
  }

  const { data } = activeStorageClient.storage.from(bucketName).getPublicUrl(objectPath);

  return NextResponse.json({
    url: data.publicUrl,
    path: objectPath,
  });
}

