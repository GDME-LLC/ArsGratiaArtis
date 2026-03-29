import { redirect } from "next/navigation";

import { AdminPlatformToolsPanel } from "@/components/admin/admin-platform-tools-panel";
import { AdminToolsNav } from "@/components/admin/admin-tools-nav";
import { SectionShell } from "@/components/marketing/section-shell";
import { StatePanel } from "@/components/shared/state-panel";
import { getAdminUser } from "@/lib/admin";
import { getPlatformSettings, listAdminPlatformFilmOptions } from "@/lib/platform-settings";
import { FILM_CATEGORY_LABELS } from "@/lib/films/categories";
import { getPublicFilmCardById, listPublishedFilms, listStaffPickFilms } from "@/lib/services/films";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <SectionShell className="py-20">
        <StatePanel
          title="Admin tools need a live database connection"
          description="The admin shell can render locally, but badge management and moderation controls require real auth and live platform data."
        />
      </SectionShell>
    );
  }

  const adminUser = await getAdminUser();
  if (!adminUser) {
    redirect("/dashboard");
  }

  const platformSettings = await getPlatformSettings();
  const [filmOptions, manualSpotlightFilm, staffPickFilms, featuredFilmResponse, featuredBeyondResponse, newReleaseResponse, newExperimentsResponse] = await Promise.all([
    listAdminPlatformFilmOptions(24).catch(() => []),
    platformSettings.homepageSpotlightFilmId ? getPublicFilmCardById(platformSettings.homepageSpotlightFilmId) : Promise.resolve(null),
    listStaffPickFilms(8).catch(() => []),
    listPublishedFilms({ page: 1, pageSize: 12, categories: ["film"], sortBy: "created_at" }).catch(() => ({ films: [], hasMore: false })),
    listPublishedFilms({ page: 1, pageSize: 12, categories: platformSettings.beyondCinemaCategories, sortBy: "likes" }).catch(() => ({ films: [], hasMore: false })),
    listPublishedFilms({ page: 1, pageSize: 12, sortBy: "created_at" }).catch(() => ({ films: [], hasMore: false })),
    listPublishedFilms({ page: 1, pageSize: 12, categories: platformSettings.beyondCinemaCategories, sortBy: "created_at" }).catch(() => ({ films: [], hasMore: false })),
  ]);

  const automaticSpotlightFilm =
    staffPickFilms[0] ??
    featuredFilmResponse.films[0] ??
    newReleaseResponse.films[0] ??
    featuredBeyondResponse.films[0] ??
    newExperimentsResponse.films[0] ??
    null;
  const automaticSpotlightLabel = staffPickFilms.length > 0 ? "Staff Pick" : featuredFilmResponse.films.length > 0 ? "Featured Film" : "Latest Release";

  const mergedFilmOptions =
    manualSpotlightFilm && !filmOptions.some((film) => film.id === manualSpotlightFilm.id)
      ? [
          {
            id: manualSpotlightFilm.id,
            title: manualSpotlightFilm.title,
            slug: manualSpotlightFilm.slug,
            synopsis: manualSpotlightFilm.synopsis,
            posterUrl: manualSpotlightFilm.posterUrl,
            muxPlaybackId: manualSpotlightFilm.muxPlaybackId,
            category: manualSpotlightFilm.category,
            categoryLabel: FILM_CATEGORY_LABELS[manualSpotlightFilm.category],
            publishedAt: manualSpotlightFilm.publishedAt,
            createdAt: manualSpotlightFilm.createdAt,
            staffPick: manualSpotlightFilm.staffPick,
          },
          ...filmOptions,
        ]
      : filmOptions;

  return (
    <SectionShell className="py-10 sm:py-12">
      <AdminToolsNav current="overview" />

      <div className="mt-4 max-w-3xl">
        <p className="display-kicker">Admin Tools</p>
        <h1 className="headline-xl mt-3">Platform management</h1>
        <p className="body-lg mt-3 text-muted-foreground">
          Control the homepage spotlight, full hero copy, and Beyond Cinema category inputs directly from the admin dashboard.
        </p>
      </div>

      <AdminPlatformToolsPanel
        initialSettings={platformSettings}
        filmOptions={mergedFilmOptions}
        currentAutoSpotlightFilm={automaticSpotlightFilm}
        currentAutoSpotlightLabel={automaticSpotlightLabel}
      />
    </SectionShell>
  );
}
