import type { PublicFilmCard } from "@/types";

import {
  BEYOND_CINEMA_CATEGORIES,
  FILM_CATEGORY_LABELS,
  type FilmCategory,
} from "@/lib/films/categories";
import {
  getDefaultHeroContentSettings,
  getDefaultPlatformSettings,
  getLegacyHeroFieldsFromHeroContent,
  normalizeHeroContentSettings,
  PLATFORM_HERO_DESCRIPTION_LIMIT,
  PLATFORM_HERO_MOTTO_LIMIT,
  PLATFORM_HERO_PANEL_DESCRIPTION_LIMIT,
  PLATFORM_HERO_PANEL_KICKER_LIMIT,
  PLATFORM_HERO_PANEL_TITLE_LIMIT,
  PLATFORM_HERO_SUBMOTTO_LIMIT,
  PLATFORM_HERO_TITLE_LIMIT,
  PLATFORM_HOMEPAGE_SPOTLIGHT_LABEL_LIMIT,
  type HeroContentSettings,
  type PlatformFilmOption,
  type PlatformSettings,
} from "@/lib/platform-settings-shared";
import { moderateTextFields } from "@/lib/security/moderation";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminProfileId } from "@/lib/admin";

export {
  getDefaultHeroContentSettings,
  getDefaultPlatformSettings,
  getLegacyHeroFieldsFromHeroContent,
  normalizeHeroContentSettings,
  PLATFORM_HERO_DESCRIPTION_LIMIT,
  PLATFORM_HERO_MOTTO_LIMIT,
  PLATFORM_HERO_PANEL_DESCRIPTION_LIMIT,
  PLATFORM_HERO_PANEL_KICKER_LIMIT,
  PLATFORM_HERO_PANEL_TITLE_LIMIT,
  PLATFORM_HERO_SUBMOTTO_LIMIT,
  PLATFORM_HERO_TITLE_LIMIT,
  PLATFORM_HOMEPAGE_SPOTLIGHT_LABEL_LIMIT,
  type HeroContentSettings,
  type PlatformFilmOption,
  type PlatformSettings,
} from "@/lib/platform-settings-shared";

type PlatformSettingsRow = {
  homepage_spotlight_film_id: string | null;
  homepage_spotlight_label: string | null;
  hero_motto: string | null;
  hero_title: string | null;
  hero_description: string | null;
  hero_content: unknown;
  beyond_cinema_categories: unknown;
};

type PlatformFilmOptionRow = {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  poster_url: string | null;
  mux_playback_id: string | null;
  category: FilmCategory;
  published_at: string | null;
  created_at: string;
  staff_pick?: boolean | null;
};

type PlatformSettingsMutationClient = NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>> | NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>;

function normalizeBeyondCinemaCategories(value: unknown): FilmCategory[] {
  const source = Array.isArray(value) ? value : [];
  const categories = source.filter(
    (category): category is FilmCategory =>
      typeof category === "string" && (BEYOND_CINEMA_CATEGORIES as readonly string[]).includes(category),
  );

  return categories.length > 0 ? [...new Set(categories)] : [...BEYOND_CINEMA_CATEGORIES];
}

function trimText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function createLegacyAwareHeroContent(row: Partial<PlatformSettingsRow> | null | undefined) {
  const defaults = getDefaultHeroContentSettings();

  return normalizeHeroContentSettings(row?.hero_content, {
    ...defaults,
    motto: {
      ...defaults.motto,
      text: trimText(row?.hero_motto) || defaults.motto.text,
    },
    title: {
      ...defaults.title,
      text: trimText(row?.hero_title) || defaults.title.text,
    },
    description: {
      ...defaults.description,
      text: trimText(row?.hero_description) || defaults.description.text,
    },
  });
}

function normalizePlatformSettingsRow(row: Partial<PlatformSettingsRow> | null | undefined): PlatformSettings {
  const defaults = getDefaultPlatformSettings();
  const heroContent = createLegacyAwareHeroContent(row);

  return {
    homepageSpotlightFilmId:
      typeof row?.homepage_spotlight_film_id === "string" && row.homepage_spotlight_film_id.trim()
        ? row.homepage_spotlight_film_id
        : null,
    homepageSpotlightLabel:
      typeof row?.homepage_spotlight_label === "string" && row.homepage_spotlight_label.trim()
        ? row.homepage_spotlight_label.trim()
        : null,
    ...getLegacyHeroFieldsFromHeroContent(heroContent),
    heroContent,
    beyondCinemaCategories: normalizeBeyondCinemaCategories(row?.beyond_cinema_categories ?? defaults.beyondCinemaCategories),
  };
}

function isPlatformSettingsRlsError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("row-level security") || message.includes("violates rls") || message.includes("violates row-level security policy");
}

async function validateSpotlightFilm(client: PlatformSettingsMutationClient, filmId: string) {
  const { data, error } = await client
    .from("films")
    .select("id")
    .eq("id", filmId)
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

async function persistPlatformSettings(client: PlatformSettingsMutationClient, values: {
  homepageSpotlightFilmId: string | null;
  homepageSpotlightLabel: string | null;
  heroContent: HeroContentSettings;
  beyondCinemaCategories: FilmCategory[];
}) {
  const legacyHeroFields = getLegacyHeroFieldsFromHeroContent(values.heroContent);
  const { data, error } = await client
    .from("platform_settings")
    .upsert(
      {
        id: true,
        homepage_spotlight_film_id: values.homepageSpotlightFilmId,
        homepage_spotlight_label: values.homepageSpotlightLabel,
        hero_motto: legacyHeroFields.heroMotto,
        hero_title: legacyHeroFields.heroTitle,
        hero_description: legacyHeroFields.heroDescription,
        hero_content: values.heroContent,
        beyond_cinema_categories: values.beyondCinemaCategories,
      },
      { onConflict: "id" },
    )
    .select("homepage_spotlight_film_id, homepage_spotlight_label, hero_motto, hero_title, hero_description, hero_content, beyond_cinema_categories")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizePlatformSettingsRow(data as PlatformSettingsRow);
}

function validateHeroContent(heroContent: HeroContentSettings) {
  const checks: Array<{ label: string; value: string; limit: number }> = [
    { label: "Hero motto", value: heroContent.motto.text, limit: PLATFORM_HERO_MOTTO_LIMIT },
    { label: "Hero submotto", value: heroContent.submotto.text, limit: PLATFORM_HERO_SUBMOTTO_LIMIT },
    { label: "Hero title", value: heroContent.title.text, limit: PLATFORM_HERO_TITLE_LIMIT },
    { label: "Hero description", value: heroContent.description.text, limit: PLATFORM_HERO_DESCRIPTION_LIMIT },
    { label: "Films heading", value: heroContent.panels.films.kicker.text, limit: PLATFORM_HERO_PANEL_KICKER_LIMIT },
    { label: "Films title", value: heroContent.panels.films.title.text, limit: PLATFORM_HERO_PANEL_TITLE_LIMIT },
    { label: "Films body", value: heroContent.panels.films.description.text, limit: PLATFORM_HERO_PANEL_DESCRIPTION_LIMIT },
    { label: "Creators heading", value: heroContent.panels.creators.kicker.text, limit: PLATFORM_HERO_PANEL_KICKER_LIMIT },
    { label: "Creators title", value: heroContent.panels.creators.title.text, limit: PLATFORM_HERO_PANEL_TITLE_LIMIT },
    { label: "Creators body", value: heroContent.panels.creators.description.text, limit: PLATFORM_HERO_PANEL_DESCRIPTION_LIMIT },
    { label: "Resources heading", value: heroContent.panels.resources.kicker.text, limit: PLATFORM_HERO_PANEL_KICKER_LIMIT },
    { label: "Resources title", value: heroContent.panels.resources.title.text, limit: PLATFORM_HERO_PANEL_TITLE_LIMIT },
    { label: "Resources body", value: heroContent.panels.resources.description.text, limit: PLATFORM_HERO_PANEL_DESCRIPTION_LIMIT },
  ];

  for (const check of checks) {
    if (check.value.length > check.limit) {
      throw new Error(`${check.label} must be ${check.limit} characters or fewer.`);
    }
  }
}

function listHeroContentModerationFields(heroContent: HeroContentSettings) {
  return [
    { label: "hero_motto", value: heroContent.motto.text },
    { label: "hero_submotto", value: heroContent.submotto.text },
    { label: "hero_title", value: heroContent.title.text },
    { label: "hero_description", value: heroContent.description.text },
    { label: "hero_films_kicker", value: heroContent.panels.films.kicker.text },
    { label: "hero_films_title", value: heroContent.panels.films.title.text },
    { label: "hero_films_description", value: heroContent.panels.films.description.text },
    { label: "hero_creators_kicker", value: heroContent.panels.creators.kicker.text },
    { label: "hero_creators_title", value: heroContent.panels.creators.title.text },
    { label: "hero_creators_description", value: heroContent.panels.creators.description.text },
    { label: "hero_resources_kicker", value: heroContent.panels.resources.kicker.text },
    { label: "hero_resources_title", value: heroContent.panels.resources.title.text },
    { label: "hero_resources_description", value: heroContent.panels.resources.description.text },
  ];
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return getDefaultPlatformSettings();
  }

  const { data, error } = await supabase
    .from("platform_settings")
    .select("homepage_spotlight_film_id, homepage_spotlight_label, hero_motto, hero_title, hero_description, hero_content, beyond_cinema_categories")
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
    rows = await runQuery("id, title, slug, synopsis, poster_url, mux_playback_id, category, published_at, created_at, staff_pick");
  } catch {
    rows = await runQuery("id, title, slug, synopsis, poster_url, mux_playback_id, category, published_at, created_at");
  }

  return rows.map((film) => ({
    id: film.id,
    title: film.title,
    slug: film.slug,
    synopsis: film.synopsis ?? null,
    posterUrl: film.poster_url ?? null,
    muxPlaybackId: film.mux_playback_id ?? null,
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

export async function updatePlatformSettings(
  input: {
    homepageSpotlightFilmId?: string | null;
    homepageSpotlightLabel?: string | null;
    heroContent?: HeroContentSettings;
    beyondCinemaCategories?: string[];
  },
  options?: {
    actorUserId?: string | null;
  },
) {
  const serviceSupabase = createServiceRoleSupabaseClient();
  const serverSupabase = await createServerSupabaseClient();
  const readableSupabase = serviceSupabase ?? serverSupabase;

  if (!readableSupabase) {
    throw new Error("Supabase is not configured.");
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
  const heroContent = normalizeHeroContentSettings(input.heroContent ?? current.heroContent, current.heroContent);
  const beyondCinemaCategories = normalizeBeyondCinemaCategories(input.beyondCinemaCategories ?? current.beyondCinemaCategories);

  validateHeroContent(heroContent);

  if (homepageSpotlightLabel && homepageSpotlightLabel.length > PLATFORM_HOMEPAGE_SPOTLIGHT_LABEL_LIMIT) {
    throw new Error(`Spotlight label must be ${PLATFORM_HOMEPAGE_SPOTLIGHT_LABEL_LIMIT} characters or fewer.`);
  }

  const moderation = await moderateTextFields([
    ...listHeroContentModerationFields(heroContent),
    { label: "homepage_spotlight_label", value: homepageSpotlightLabel },
  ]);

  if (!moderation.ok) {
    throw new Error(moderation.message);
  }

  if (homepageSpotlightFilmId) {
    await validateSpotlightFilm(readableSupabase, homepageSpotlightFilmId);
  }

  const values = {
    homepageSpotlightFilmId,
    homepageSpotlightLabel,
    heroContent,
    beyondCinemaCategories,
  };

  let serviceRoleError: Error | null = null;

  if (serviceSupabase) {
    try {
      return await persistPlatformSettings(serviceSupabase, values);
    } catch (error) {
      serviceRoleError = error instanceof Error ? error : new Error("Platform settings could not be updated.");

      if (!serverSupabase || !isPlatformSettingsRlsError(serviceRoleError)) {
        throw serviceRoleError;
      }
    }
  }

  if (!serverSupabase) {
    throw serviceRoleError ?? new Error("Supabase is not configured.");
  }

  try {
    return await persistPlatformSettings(serverSupabase, values);
  } catch (error) {
    const serverError = error instanceof Error ? error : new Error("Platform settings could not be updated.");

    if (isPlatformSettingsRlsError(serverError) && options?.actorUserId) {
      const hasDatabaseAdminAccess = await isAdminProfileId(options.actorUserId);

      if (!hasDatabaseAdminAccess) {
        throw new Error(
          "Your account can open admin tools, but saving platform settings requires your profile in public.admin_users or a valid SUPABASE_SERVICE_ROLE_KEY.",
        );
      }
    }

    throw serviceRoleError ?? serverError;
  }
}
