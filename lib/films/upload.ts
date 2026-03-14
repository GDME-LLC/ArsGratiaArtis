export const MAX_VIDEO_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;

export const VIDEO_UPLOAD_LIMIT_MESSAGE = `Uploads must be under 2GB.
For best performance we recommend exporting H.264 MP4 under 1080p.`;

export const ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".m4v", ".webm"] as const;
export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-m4v",
  "video/webm",
] as const;

export function sanitizeUploadFilename(fileName: string) {
  return fileName.replace(/[/\\\u0000-\u001f\u007f]+/g, "-").trim();
}

export function getFileExtension(fileName: string) {
  const normalized = sanitizeUploadFilename(fileName).toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");
  return dotIndex >= 0 ? normalized.slice(dotIndex) : "";
}

export function validateVideoUploadMetadata(input: {
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
}) {
  const fileSize = input.fileSize ?? 0;

  if (!fileSize || !Number.isFinite(fileSize) || fileSize <= 0) {
    return { ok: false as const, message: "Choose a valid video file before uploading." };
  }

  if (fileSize > MAX_VIDEO_UPLOAD_BYTES) {
    return { ok: false as const, message: VIDEO_UPLOAD_LIMIT_MESSAGE };
  }

  const extension = getFileExtension(input.fileName ?? "");

  if (!extension || !ALLOWED_VIDEO_EXTENSIONS.includes(extension as (typeof ALLOWED_VIDEO_EXTENSIONS)[number])) {
    return {
      ok: false as const,
      message: "Unsupported video format. Upload MP4, MOV, M4V, or WebM files only.",
    };
  }

  const normalizedType = (input.fileType ?? "").toLowerCase().trim();

  if (normalizedType && !ALLOWED_VIDEO_MIME_TYPES.includes(normalizedType as (typeof ALLOWED_VIDEO_MIME_TYPES)[number])) {
    return {
      ok: false as const,
      message: "Unsupported video format. Upload MP4, MOV, M4V, or WebM files only.",
    };
  }

  return { ok: true as const, fileName: sanitizeUploadFilename(input.fileName ?? "") };
}
