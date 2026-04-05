const DEFAULT_MEDIA_BUCKET = "media";

export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const IMAGE_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.webp";
export const IMAGE_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type MediaEntityType = "film" | "profile";
export type MediaField = "poster" | "avatar" | "banner" | "hero";

export function getMediaBucketName() {
  return process.env.SUPABASE_MEDIA_BUCKET?.trim() || DEFAULT_MEDIA_BUCKET;
}

export function isAllowedImageMimeType(type: string) {
  return IMAGE_UPLOAD_MIME_TYPES.includes(type as (typeof IMAGE_UPLOAD_MIME_TYPES)[number]);
}

export function getImageUploadError(type: string, size: number) {
  if (!isAllowedImageMimeType(type)) {
    return "Upload a JPG, PNG, or WebP image.";
  }

  if (size > IMAGE_UPLOAD_MAX_BYTES) {
    return "Images must be 10 MB or smaller.";
  }

  return null;
}

function sanitizeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

function getFileExtension(fileName: string, mimeType: string) {
  const normalizedName = fileName.toLowerCase();

  if (normalizedName.endsWith(".png")) {
    return "png";
  }

  if (normalizedName.endsWith(".webp")) {
    return "webp";
  }

  if (normalizedName.endsWith(".jpg") || normalizedName.endsWith(".jpeg")) {
    return "jpg";
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export function buildMediaObjectPath(input: {
  userId: string;
  entityType: MediaEntityType;
  field: MediaField;
  fileName: string;
  mimeType: string;
}) {
  const extension = getFileExtension(input.fileName, input.mimeType);
  const baseName = sanitizeSegment(input.fileName.replace(/\.[^/.]+$/, ""));

  return [
    "users",
    sanitizeSegment(input.userId),
    input.entityType,
    input.field,
    `${Date.now()}-${crypto.randomUUID()}-${baseName}.${extension}`,
  ].join("/");
}

export const WORKFLOW_ASSET_UPLOAD_MAX_BYTES = 100 * 1024 * 1024;
export const WORKFLOW_ASSET_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const WORKFLOW_ASSET_AUDIO_MIME_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a"] as const;
export const WORKFLOW_ASSET_VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;
export const WORKFLOW_ASSET_ALL_MIME_TYPES = [
  ...WORKFLOW_ASSET_IMAGE_MIME_TYPES,
  ...WORKFLOW_ASSET_AUDIO_MIME_TYPES,
  ...WORKFLOW_ASSET_VIDEO_MIME_TYPES,
] as const;

export type WorkflowAssetMimeType = (typeof WORKFLOW_ASSET_ALL_MIME_TYPES)[number];

export function isAllowedWorkflowAssetMimeType(type: string): type is WorkflowAssetMimeType {
  return WORKFLOW_ASSET_ALL_MIME_TYPES.includes(type as WorkflowAssetMimeType);
}

export function getWorkflowAssetUploadError(type: string, size: number) {
  if (!isAllowedWorkflowAssetMimeType(type)) {
    return "Upload a JPG, PNG, WebP image, MP3/WAV/OGG/M4A audio, or MP4/MOV/WebM video file.";
  }

  if (size > WORKFLOW_ASSET_UPLOAD_MAX_BYTES) {
    return "Workflow asset files must be 100 MB or smaller.";
  }

  return null;
}

function getWorkflowAssetExtension(fileName: string, mimeType: string): string {
  const lower = fileName.toLowerCase();
  for (const ext of ["png", "webp", "jpg", "jpeg", "mp3", "wav", "ogg", "m4a", "mp4", "mov", "webm"]) {
    if (lower.endsWith(`.${ext}`)) {
      return ext === "jpeg" ? "jpg" : ext;
    }
  }

  const mimeMap: Record<string, string> = {
    "image/png": "png",
    "image/webp": "webp",
    "image/jpeg": "jpg",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };

  return mimeMap[mimeType] ?? "bin";
}

export function buildWorkflowAssetObjectPath(input: {
  userId: string;
  draftId: string;
  fileName: string;
  mimeType: string;
}) {
  const extension = getWorkflowAssetExtension(input.fileName, input.mimeType);
  const baseName = sanitizeSegment(input.fileName.replace(/\.[^/.]+$/, ""));

  return [
    "users",
    sanitizeSegment(input.userId),
    "workflow-assets",
    sanitizeSegment(input.draftId),
    `${Date.now()}-${crypto.randomUUID()}-${baseName}.${extension}`,
  ].join("/");
}

(url: string | null | undefined, bucketName = getMediaBucketName()) {
  if (!url) {
    return null;
  }

  const marker = `/storage/v1/object/public/${bucketName}/`;
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return url.slice(markerIndex + marker.length);
}
