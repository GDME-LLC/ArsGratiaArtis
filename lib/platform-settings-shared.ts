import { siteConfig } from "@/lib/constants/site";
import {
  BEYOND_CINEMA_CATEGORIES,
  type FilmCategory,
} from "@/lib/films/categories";

export const PLATFORM_HERO_MOTTO_LIMIT = 40;
export const PLATFORM_HERO_TITLE_LIMIT = 90;
export const PLATFORM_HERO_DESCRIPTION_LIMIT = 220;
export const PLATFORM_HOMEPAGE_SPOTLIGHT_LABEL_LIMIT = 32;

export type PlatformSettings = {
  homepageSpotlightFilmId: string | null;
  homepageSpotlightLabel: string | null;
  heroMotto: string;
  heroTitle: string;
  heroDescription: string;
  beyondCinemaCategories: FilmCategory[];
};

export type PlatformFilmOption = {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  posterUrl: string | null;
  category: FilmCategory;
  categoryLabel: string;
  publishedAt: string | null;
  createdAt: string;
  staffPick: boolean;
};

export function getDefaultPlatformSettings(): PlatformSettings {
  return {
    homepageSpotlightFilmId: null,
    homepageSpotlightLabel: null,
    heroMotto: siteConfig.motto,
    heroTitle: siteConfig.heroTitle,
    heroDescription: siteConfig.heroDescription,
    beyondCinemaCategories: [...BEYOND_CINEMA_CATEGORIES],
  };
}
