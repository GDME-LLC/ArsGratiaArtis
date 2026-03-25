import { theatreStylePresets, type TheatreStylePresetDefinition } from "@/lib/constants/theatre-style-presets";
import {
  CREATIVE_PROCESS_SUMMARY_LIMIT,
  normalizeToolSlugs,
} from "@/lib/constants/process";
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
    id: "creative_stack",
    label: "Creative Stack",
    description: "Preferred tools and a short note on practice or methods.",
  },
  {
    id: "featured_work",
    label: "Featured Work",
    description: "A single spotlighted release placed near the opening of the Theatre.",
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
  preferredToolSlugs: [],
  creativeProcessSummary: null,
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
  const preferredToolSlugs = normalizeToolSlugs(source.preferredToolSlugs);
  const creativeProcessSummaryRaw = typeof source.creativeProcessSummary === "string"
    ? source.creativeProcessSummary.trim()
    : "";
  const creativeProcessSummary = creativeProcessSummaryRaw
    ? creativeProcessSummaryRaw.slice(0, CREATIVE_PROCESS_SUMMARY_LIMIT)
    : null;
  const visibleSections = normalizeSectionIds(source.visibleSections, defaultTheatreSettings.visibleSections);
  const orderedSections = normalizeSectionIds(source.sectionOrder, defaultTheatreSettings.sectionOrder);
  const missingSections = theatreSectionDefinitions.map((section) => section.id).filter((sectionId) => !orderedSections.includes(sectionId));

  return {
    stylePreset,
    heroImageUrl,
    heroVideoUrl,
    openingStatement,
    featuredFilmId,
    preferredToolSlugs,
    creativeProcessSummary,
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
