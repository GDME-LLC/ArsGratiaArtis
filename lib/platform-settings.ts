import type { PublicFilmCard } from "@/types";

import {
  BEYOND_CINEMA_CATEGORIES,
  FILM_CATEGORY_LABELS,
  type FilmCategory,
} from "@/lib/films/categories";
import {
  getDefaultPlatformSettings,
  PLATFORM_HERO_DESCRIPTION_LIMIT,
  PLATFORM_HERO_MOTTO_LIMIT,
  PLATFORM_HERO_TITLE_LIMIT,
  PLATFORM_HOMEPAGE_SPOTLIGHT_LABEL_LIMIT,
  type PlatformFilmOption,
  type PlatformSettings,
} from "@/lib/platform-settings-shared";
import { moderateTextFields } from "@/lib/security/moderation";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export {
  getDefaultPlatformSettings,
  PLATFORM_HERO_DESCRIPTION_LIMIT,
  PLATFORM_HERO_MOTTO_LIMIT,
  PLATFORM_HERO_TITLE_LIMIT,
  PLATFORM_HOMEPAGE_SPOTLIGHT_LABEL_LIMIT,
  type PlatformFilmOption,
  type PlatformSettings,
} from "@/lib/platform-settings-shared";

type PlatformSettingsRow = {
  homepage_spotlight_film_id: string | null;
  homepage_spotlight_label: string | null;
  hero_motto: string | null;
  hero_title: string | null;
  hero_description: string | null;
  beyond_cinema_categories: unknown;
};

type PlatformFilmOptionRow = {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  poster_url: string | null;
  category: FilmCategory;
  published_at: string | null;
  created_at: string;
  staff_pick?: boolean | null;
};

function normalizeBeyondCinemaCategories(value: unknown): FilmCategory[] {
  const source = Array.isArray(value) ? value : [];
  const categories = source.filter(
    (category): category is FilmCategory =>
      typeof category === "string" && (BEYOND_CINEMA_CATEGORIES as readonly string[]).includes(category),
  );

  return categories.length > 0 ? [...new Set(categories)] : [...BEYOND_CINEMA_CATEGORIES];
}

function normalizePlatformSettingsRow(row: Partial<PlatformSettingsRow> | null | undefined): PlatformSettings {
  const defaults = getDefaultPlatformSettings();

  return {
    homepageSpotlightFilmId:
      typeof row?.homepage_spotlight_film_id === "string" && row.homepage_spotlight_film_id.trim()
        ? row.homepage_spotlight_film_id
        : null,
    homepageSpotlightLabel:
      typeof row?.homepage_spotlight_label === "string" && row.homepage_spotlight_label.trim()
        ? row.homepage_spotlight_label.trim()
        : null,
    heroMotto:
      typeof row?.hero_motto === "string" && row.hero_motto.trim()
        ? row.hero_motto.trim()
        : defaults.heroMotto,
    heroTitle:
      typeof row?.hero_title === "string" && row.hero_title.trim()
        ? row.hero_title.trim()
        : defaults.heroTitle,
    heroDescription:
      typeof row?.hero_description === "string" && row.hero_description.trim()
        ? row.hero_description.trim()
        : defaults.heroDescription,
    beyondCinemaCategories: normalizeBeyondCinemaCategories(row?.beyond_cinema_categories),
  };
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return getDefaultPlatformSettings();
  }

  const { data, error } = await supabase
    .from("platform_settings")
    .select("homepage_spotlight_film_id, homepage_spotlight_label, hero_motto, hero_title, hero_description, beyond_cinema_categories")
    .eq("id", true)
    .maybeSingle();

  if (error || !data) {
    return getDefaultPlatformSettings();
  }

  return normalizePlatformSettingsRow(data as PlatformSettingsRow);
}

export async function listAdminPlatformFilmOptions(limit = 24): Promise<PlatformFilmOption[]> {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return [];
  }

  const pageSize = Math.min(40, Math.max(1, limit));

  const runQuery = async (selectClause: string) => {
    const { data, error } = await supabase
      .from("films")
      .select(selectClause)
      .eq("publish_status", "published")
      .eq("visibility", "public")
      .eq("moderation_status", "active")
      .order("staff_pick", { ascending: false })
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(pageSize);

    if (error) {
      throw error;
    }

    return ((data ?? []) as unknown) as PlatformFilmOptionRow[];
  };

  let rows: PlatformFilmOptionRow[] = [];

  try {
    rows = await runQuery("id, title, slug, synopsis, poster_url, category, published_at, created_at, staff_pick");
  } catch {
    rows = await runQuery("id, title, slug, synopsis, poster_url, category, published_at, created_at");
  }

  return rows.map((film) => ({
    id: film.id,
    title: film.title,
    slug: film.slug,
    synopsis: film.synopsis ?? null,
    posterUrl: film.poster_url ?? null,
    category: film.category,
    categoryLabel: FILM_CATEGORY_LABELS[film.category],
    publishedAt: film.published_at ?? null,
    createdAt: film.created_at,
    staffPick: Boolean(film.staff_pick ?? false),
  }));
}

export function resolveHomepageSpotlight(
  settings: PlatformSettings,
  manualSpotlightFilm: PublicFilmCard | null,
  automaticSpotlightFilm: PublicFilmCard | null,
  automaticSpotlightLabel: string,
) {
  if (manualSpotlightFilm) {
    return {
      spotlightFilm: manualSpotlightFilm,
      spotlightLabel: settings.homepageSpotlightLabel?.trim() || "Featured Film",
    };
  }

  return {
    spotlightFilm: automaticSpotlightFilm,
    spotlightLabel: automaticSpotlightLabel,
  };
}

export async function updatePlatformSettings(input: {
  homepageSpotlightFilmId?: string | null;
  homepageSpotlightLabel?: string | null;
  heroMotto?: string;
  heroTitle?: string;
  heroDescription?: string;
  beyondCinemaCategories?: string[];
}) {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const current = await getPlatformSettings();
  const homepageSpotlightFilmId =
    typeof input.homepageSpotlightFilmId === "string" && input.homepageSpotlightFilmId.trim()
      ? input.homepageSpotlightFilmId.trim()
      : null;
  const homepageSpotlightLabel =
    typeof input.homepageSpotlightLabel === "string" && input.homepageSpotlightLabel.trim()
      ? input.homepageSpotlightLabel.trim()
      : null;
  const heroMotto = typeof input.heroMotto === "string" ? input.heroMotto.trim() : current.heroMotto;
  const heroTitle = typeof input.heroTitle === "string" ? input.heroTitle.trim() : current.heroTitle;
  const heroDescription = typeof input.heroDescription === "string" ? input.heroDescription.trim() : current.heroDescription;
  const beyondCinemaCategories = normalizeBeyondCinemaCategories(input.beyondCinemaCategories ?? current.beyondCinemaCategories);

  if (!heroMotto) {
    throw new Error("Hero motto is required.");
  }

  if (!heroTitle) {
    throw new Error("Hero title is required.");
  }

  if (!heroDescription) {
    throw new Error("Hero description is required.");
  }

  if (heroMotto.length > PLATFORM_HERO_MOTTO_LIMIT) {
    throw new Error(`Hero motto must be ${PLATFORM_HERO_MOTTO_LIMIT} characters or fewer.`);
  }

  if (heroTitle.length > PLATFORM_HERO_TITLE_LIMIT) {
    throw new Error(`Hero title must be ${PLATFORM_HERO_TITLE_LIMIT} characters or fewer.`);
  }

  if (heroDescription.length > PLATFORM_HERO_DESCRIPTION_LIMIT) {
    throw new Error(`Hero description must be ${PLATFORM_HERO_DESCRIPTION_LIMIT} characters or fewer.`);
  }

  if (homepageSpotlightLabel && homepageSpotlightLabel.length > PLATFORM_HOMEPAGE_SPOTLIGHT_LABEL_LIMIT) {
    throw new Error(`Spotlight label must be ${PLATFORM_HOMEPAGE_SPOTLIGHT_LABEL_LIMIT} characters or fewer.`);
  }

  const moderation = await moderateTextFields([
    { label: "hero_motto", value: heroMotto },
    { label: "hero_title", value: heroTitle },
    { label: "hero_description", value: heroDescription },
    { label: "homepage_spotlight_label", value: homepageSpotlightLabel },
  ]);

  if (!moderation.ok) {
    throw new Error(moderation.message);
  }

  if (homepageSpotlightFilmId) {
    const { data, error } = await supabase
      .from("films")
      .select("id")
      .eq("id", homepageSpotlightFilmId)
      .eq("publish_status", "published")
      .eq("visibility", "public")
      .eq("moderation_status", "active")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Selected spotlight film is not available for the public homepage.");
    }
  }

  const { data, error } = await supabase
    .from("platform_settings")
    .upsert(
      {
        id: true,
        homepage_spotlight_film_id: homepageSpotlightFilmId,
        homepage_spotlight_label: homepageSpotlightLabel,
        hero_motto: heroMotto,
        hero_title: heroTitle,
        hero_description: heroDescription,
        beyond_cinema_categories: beyondCinemaCategories,
      },
      { onConflict: "id" },
    )
    .select("homepage_spotlight_film_id, homepage_spotlight_label, hero_motto, hero_title, hero_description, beyond_cinema_categories")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizePlatformSettingsRow(data as PlatformSettingsRow);
}

