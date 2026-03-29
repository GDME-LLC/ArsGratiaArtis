import { siteConfig } from "@/lib/constants/site";
import {
  BEYOND_CINEMA_CATEGORIES,
  type FilmCategory,
} from "@/lib/films/categories";

export const PLATFORM_HERO_MOTTO_LIMIT = 40;
export const PLATFORM_HERO_SUBMOTTO_LIMIT = 56;
export const PLATFORM_HERO_TITLE_LIMIT = 90;
export const PLATFORM_HERO_DESCRIPTION_LIMIT = 220;
export const PLATFORM_HERO_PANEL_KICKER_LIMIT = 24;
export const PLATFORM_HERO_PANEL_TITLE_LIMIT = 72;
export const PLATFORM_HERO_PANEL_DESCRIPTION_LIMIT = 180;
export const PLATFORM_HOMEPAGE_SPOTLIGHT_LABEL_LIMIT = 32;

export const HERO_COPY_COLOR_VALUES = ["gold", "ivory", "soft", "muted", "rose", "slate"] as const;
export const HERO_COPY_SIZE_VALUES = ["sm", "md", "lg"] as const;
export const HERO_PANEL_ORDER = ["films", "creators", "resources"] as const;

export type HeroCopyColor = (typeof HERO_COPY_COLOR_VALUES)[number];
export type HeroCopySize = (typeof HERO_COPY_SIZE_VALUES)[number];
export type HeroPanelId = (typeof HERO_PANEL_ORDER)[number];

export type HeroCopyLine = {
  text: string;
  color: HeroCopyColor;
  size: HeroCopySize;
};

export type HeroPanelCopy = {
  kicker: HeroCopyLine;
  title: HeroCopyLine;
  description: HeroCopyLine;
};

export type HeroContentSettings = {
  motto: HeroCopyLine;
  submotto: HeroCopyLine;
  title: HeroCopyLine;
  description: HeroCopyLine;
  panels: Record<HeroPanelId, HeroPanelCopy>;
};

export type PlatformSettings = {
  homepageSpotlightFilmId: string | null;
  homepageSpotlightLabel: string | null;
  heroMotto: string;
  heroTitle: string;
  heroDescription: string;
  heroContent: HeroContentSettings;
  beyondCinemaCategories: FilmCategory[];
};

export type PlatformFilmOption = {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  posterUrl: string | null;
  muxPlaybackId: string | null;
  category: FilmCategory;
  categoryLabel: string;
  publishedAt: string | null;
  createdAt: string;
  staffPick: boolean;
};

export const HERO_COPY_COLOR_OPTIONS: Array<{ value: HeroCopyColor; label: string }> = [
  { value: "gold", label: "Gold" },
  { value: "ivory", label: "Ivory" },
  { value: "soft", label: "Soft" },
  { value: "muted", label: "Muted" },
  { value: "rose", label: "Rose" },
  { value: "slate", label: "Slate" },
];

export const HERO_COPY_SIZE_OPTIONS: Array<{ value: HeroCopySize; label: string }> = [
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
];

function isHeroCopyColor(value: unknown): value is HeroCopyColor {
  return typeof value === "string" && (HERO_COPY_COLOR_VALUES as readonly string[]).includes(value);
}

function isHeroCopySize(value: unknown): value is HeroCopySize {
  return typeof value === "string" && (HERO_COPY_SIZE_VALUES as readonly string[]).includes(value);
}

function normalizeHeroCopyLine(value: unknown, fallback: HeroCopyLine): HeroCopyLine {
  const line = typeof value === "object" && value !== null ? (value as Partial<HeroCopyLine>) : {};

  return {
    text: typeof line.text === "string" ? line.text : fallback.text,
    color: isHeroCopyColor(line.color) ? line.color : fallback.color,
    size: isHeroCopySize(line.size) ? line.size : fallback.size,
  };
}

export function getDefaultHeroContentSettings(): HeroContentSettings {
  return {
    motto: {
      text: siteConfig.motto,
      color: "gold",
      size: "md",
    },
    submotto: {
      text: "Art, for art's sake",
      color: "soft",
      size: "md",
    },
    title: {
      text: siteConfig.heroTitle,
      color: "ivory",
      size: "md",
    },
    description: {
      text: siteConfig.heroDescription,
      color: "soft",
      size: "md",
    },
    panels: {
      films: {
        kicker: { text: "Films", color: "gold", size: "md" },
        title: { text: "Release work with gravity", color: "ivory", size: "md" },
        description: {
          text: "Publish films inside a frame that feels deliberate, watchable, and worthy of the premiere.",
          color: "soft",
          size: "md",
        },
      },
      creators: {
        kicker: { text: "Creators", color: "gold", size: "md" },
        title: { text: "Build a theatre around authorship", color: "ivory", size: "md" },
        description: {
          text: "Give each filmmaker a public presence that reads like a body of work instead of a profile stub.",
          color: "soft",
          size: "md",
        },
      },
      resources: {
        kicker: { text: "Resources", color: "gold", size: "md" },
        title: { text: "Stay close to the wider field", color: "ivory", size: "md" },
        description: {
          text: "Keep the best tools, research, and communities nearby without letting them overwhelm the films themselves.",
          color: "soft",
          size: "md",
        },
      },
    },
  };
}

export function normalizeHeroContentSettings(value: unknown, fallback = getDefaultHeroContentSettings()): HeroContentSettings {
  const content = typeof value === "object" && value !== null ? (value as Partial<HeroContentSettings>) : {};
  const panelSource = typeof content.panels === "object" && content.panels !== null
    ? (content.panels as Partial<Record<HeroPanelId, Partial<HeroPanelCopy>>>)
    : {};

  return {
    motto: normalizeHeroCopyLine(content.motto, fallback.motto),
    submotto: normalizeHeroCopyLine(content.submotto, fallback.submotto),
    title: normalizeHeroCopyLine(content.title, fallback.title),
    description: normalizeHeroCopyLine(content.description, fallback.description),
    panels: {
      films: {
        kicker: normalizeHeroCopyLine(panelSource.films?.kicker, fallback.panels.films.kicker),
        title: normalizeHeroCopyLine(panelSource.films?.title, fallback.panels.films.title),
        description: normalizeHeroCopyLine(panelSource.films?.description, fallback.panels.films.description),
      },
      creators: {
        kicker: normalizeHeroCopyLine(panelSource.creators?.kicker, fallback.panels.creators.kicker),
        title: normalizeHeroCopyLine(panelSource.creators?.title, fallback.panels.creators.title),
        description: normalizeHeroCopyLine(panelSource.creators?.description, fallback.panels.creators.description),
      },
      resources: {
        kicker: normalizeHeroCopyLine(panelSource.resources?.kicker, fallback.panels.resources.kicker),
        title: normalizeHeroCopyLine(panelSource.resources?.title, fallback.panels.resources.title),
        description: normalizeHeroCopyLine(panelSource.resources?.description, fallback.panels.resources.description),
      },
    },
  };
}

export function getLegacyHeroFieldsFromHeroContent(heroContent: HeroContentSettings) {
  return {
    heroMotto: heroContent.motto.text,
    heroTitle: heroContent.title.text,
    heroDescription: heroContent.description.text,
  };
}

export function getDefaultPlatformSettings(): PlatformSettings {
  const heroContent = getDefaultHeroContentSettings();

  return {
    homepageSpotlightFilmId: null,
    homepageSpotlightLabel: null,
    ...getLegacyHeroFieldsFromHeroContent(heroContent),
    heroContent,
    beyondCinemaCategories: [...BEYOND_CINEMA_CATEGORIES],
  };
}
