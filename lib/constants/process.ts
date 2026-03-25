export const FILM_PROCESS_SUMMARY_LIMIT = 220;
export const CREATIVE_PROCESS_SUMMARY_LIMIT = 280;
export const MAX_TOOL_SELECTIONS = 8;

export const processTagOptions = [
  "AI video",
  "Image-to-video",
  "Compositing",
  "Sound design",
  "Editing",
  "Voice",
  "Upscaling",
  "Color grading",
  "Animation",
  "Motion design",
] as const;

export type ProcessTag = (typeof processTagOptions)[number];

export function normalizeProcessTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowed = new Set<string>(processTagOptions);
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }

    const trimmed = entry.trim();

    if (!trimmed || !allowed.has(trimmed) || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized.slice(0, MAX_TOOL_SELECTIONS);
}

export function normalizeToolSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }

    const slug = entry.trim().toLowerCase();

    if (!slug || seen.has(slug)) {
      continue;
    }

    seen.add(slug);
    normalized.push(slug);
  }

  return normalized.slice(0, MAX_TOOL_SELECTIONS);
}
