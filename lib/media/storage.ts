const DEFAULT_MEDIA_BUCKET = "media";

export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const IMAGE_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.webp";
export const IMAGE_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type MediaEntityType = "film" | "profile";
export type MediaField = "poster" | "avatar" | "banner";

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

export function extractStorageObjectPathFromUrl(url: string | null | undefined, bucketName = getMediaBucketName()) {
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
