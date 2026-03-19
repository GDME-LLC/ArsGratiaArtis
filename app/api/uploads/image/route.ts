import { NextResponse } from "next/server";

import { ensureProfileForUser } from "@/lib/profiles";
import {
  buildMediaObjectPath,
  extractStorageObjectPathFromUrl,
  getImageUploadError,
  getMediaBucketName,
} from "@/lib/media/storage";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

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

  if (field !== "poster" && field !== "avatar" && field !== "banner") {
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

  const profile = await ensureProfileForUser(user);

  if (!profile) {
    return NextResponse.json({ error: "Profile unavailable." }, { status: 400 });
  }

  if (entityType === "film") {
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

  const storageClient = createServiceRoleSupabaseClient() ?? supabase;
  const bucketName = getMediaBucketName();
  const objectPath = buildMediaObjectPath({
    userId: user.id,
    entityType,
    field,
    fileName: file.name,
    mimeType: file.type,
  });

  const { error } = await storageClient.storage
    .from(bucketName)
    .upload(objectPath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (typeof existingUrl === "string" && existingUrl.trim()) {
    const existingPath = extractStorageObjectPathFromUrl(existingUrl, bucketName);

    if (existingPath?.startsWith(`users/${user.id.toLowerCase()}/`)) {
      await storageClient.storage.from(bucketName).remove([existingPath]);
    }
  }

  const { data } = storageClient.storage.from(bucketName).getPublicUrl(objectPath);

  return NextResponse.json({
    url: data.publicUrl,
    path: objectPath,
  });
}
