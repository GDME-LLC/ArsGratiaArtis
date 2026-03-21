import { theatreStylePresets, type TheatreStylePresetDefinition } from "@/lib/constants/theatre-style-presets";
import type { CreatorTheatreSettings, TheatreSectionId, TheatreStylePresetId } from "@/types";

export const THEATRE_OPENING_STATEMENT_LIMIT = 160;

export const theatreSectionDefinitions: Array<{
  id: TheatreSectionId;
  label: string;
  description: string;
}> = [
  {
    id: "about",
    label: "About",
    description: "Bio and identity details near the top of the Theatre.",
  },
  {
    id: "featured_work",
    label: "Featured Work",
    description: "A single spotlighted release placed near the opening of the Theatre.",
  },
  {
    id: "workflows",
    label: "Workflows",
    description: "Selected public workflows shown in a read-only presentation.",
  },
  {
    id: "releases",
    label: "Releases",
    description: "The public body of work shown in the Theatre rail.",
  },
  {
    id: "links",
    label: "Links",
    description: "Public website and outbound profile references.",
  },
];

export const defaultTheatreSettings: CreatorTheatreSettings = {
  stylePreset: "obsidian",
  heroImageUrl: null,
  heroVideoUrl: null,
  openingStatement: null,
  featuredFilmId: null,
  visibleSections: theatreSectionDefinitions.map((section) => section.id),
  sectionOrder: theatreSectionDefinitions.map((section) => section.id),
};

export function isTheatreStylePresetId(value: unknown): value is TheatreStylePresetId {
  return typeof value === "string" && value in theatreStylePresets;
}

export function isTheatreSectionId(value: unknown): value is TheatreSectionId {
  return theatreSectionDefinitions.some((section) => section.id === value);
}

function normalizeSectionIds(value: unknown, fallback: TheatreSectionId[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const seen = new Set<TheatreSectionId>();
  const normalized: TheatreSectionId[] = [];

  for (const entry of value) {
    if (isTheatreSectionId(entry) && !seen.has(entry)) {
      seen.add(entry);
      normalized.push(entry);
    }
  }

  return normalized.length > 0 ? normalized : fallback;
}

export function normalizeTheatreSettings(value: unknown): CreatorTheatreSettings {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const stylePreset = isTheatreStylePresetId(source.stylePreset)
    ? source.stylePreset
    : defaultTheatreSettings.stylePreset;
  const heroImageUrl = typeof source.heroImageUrl === "string" && source.heroImageUrl.trim()
    ? source.heroImageUrl
    : null;
  const heroVideoUrl = typeof source.heroVideoUrl === "string" && source.heroVideoUrl.trim()
    ? source.heroVideoUrl
    : null;
  const openingStatementRaw = typeof source.openingStatement === "string"
    ? source.openingStatement.trim()
    : "";
  const openingStatement = openingStatementRaw
    ? openingStatementRaw.slice(0, THEATRE_OPENING_STATEMENT_LIMIT)
    : null;
  const featuredFilmId = typeof source.featuredFilmId === "string" && source.featuredFilmId.trim()
    ? source.featuredFilmId
    : null;
  const visibleSections = normalizeSectionIds(
    source.visibleSections,
    defaultTheatreSettings.visibleSections,
  );
  const orderedSections = normalizeSectionIds(
    source.sectionOrder,
    defaultTheatreSettings.sectionOrder,
  );
  const missingSections = theatreSectionDefinitions
    .map((section) => section.id)
    .filter((sectionId) => !orderedSections.includes(sectionId));

  return {
    stylePreset,
    heroImageUrl,
    heroVideoUrl,
    openingStatement,
    featuredFilmId,
    visibleSections,
    sectionOrder: [...orderedSections, ...missingSections],
  };
}

export function getOrderedVisibleTheatreSections(settings: CreatorTheatreSettings) {
  const visibility = new Set(settings.visibleSections);
  return settings.sectionOrder.filter((sectionId) => visibility.has(sectionId));
}

export function getTheatreStylePreset(stylePreset: TheatreStylePresetId): TheatreStylePresetDefinition {
  return theatreStylePresets[stylePreset] ?? theatreStylePresets[defaultTheatreSettings.stylePreset];
}
