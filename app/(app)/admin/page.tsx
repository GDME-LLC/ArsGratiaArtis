import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminPlatformToolsPanel } from "@/components/admin/admin-platform-tools-panel";
import { AdminToolsNav } from "@/components/admin/admin-tools-nav";
import { SectionShell } from "@/components/marketing/section-shell";
import { StatePanel } from "@/components/shared/state-panel";
import { getAdminUser } from "@/lib/admin";
import { getAdminModerationAlertCount } from "@/lib/admin-films";
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
  const [moderationAlertCount, filmOptions, manualSpotlightFilm, staffPickFilms, featuredFilmResponse, featuredBeyondResponse, newReleaseResponse, newExperimentsResponse] = await Promise.all([
    getAdminModerationAlertCount().catch(() => 0),
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

  const mergedFilmOptions = manualSpotlightFilm && !filmOptions.some((film) => film.id === manualSpotlightFilm.id)
    ? [
        {
          id: manualSpotlightFilm.id,
          title: manualSpotlightFilm.title,
          slug: manualSpotlightFilm.slug,
          synopsis: manualSpotlightFilm.synopsis,
          posterUrl: manualSpotlightFilm.posterUrl,
          category: manualSpotlightFilm.category,
          categoryLabel: FILM_CATEGORY_LABELS[manualSpotlightFilm.category],
          publishedAt: manualSpotlightFilm.publishedAt,
          createdAt: manualSpotlightFilm.createdAt,
          staffPick: manualSpotlightFilm.staffPick,
        },
        ...filmOptions,
      ]
    : filmOptions;

  const toolGroups = [
    {
      label: "Badge Management",
      title: "Curated creator distinctions",
      description:
        "Create badge definitions, protect system badges like Founding Creator, and assign distinctions cleanly across creator identity surfaces.",
      href: "/admin/badges",
      cta: "Open Badge Controls",
      alertCount: 0,
    },
    {
      label: "Moderation Tools",
      title: "Film review and visibility controls",
      description:
        "Review reported releases and users, check moderation state, and take visibility actions only where platform quality or safety needs attention.",
      href: "/admin/films",
      cta: "Open Moderation Tools",
      alertCount: moderationAlertCount,
    },
  ];

  return (
    <SectionShell className="py-14 sm:py-16">
      <AdminToolsNav current="overview" />

      <div className="mt-6 max-w-3xl">
        <p className="display-kicker">Admin Tools</p>
        <h1 className="headline-xl mt-4">Platform management</h1>
        <p className="body-lg mt-4">
          Control the homepage spotlight, hero copy, and Beyond Cinema category inputs directly from the admin dashboard, with moderation and badge workflows still available below.
        </p>
      </div>

      <AdminPlatformToolsPanel
        initialSettings={platformSettings}
        filmOptions={mergedFilmOptions}
        currentAutoSpotlightFilm={automaticSpotlightFilm}
        currentAutoSpotlightLabel={automaticSpotlightLabel}
      />

      <div className="mt-10 max-w-3xl">
        <p className="display-kicker">Operational Tools</p>
        <h2 className="headline-lg mt-3 text-foreground">Existing admin workflows</h2>
        <p className="body-sm mt-3 text-muted-foreground">
          Current live admin tools for creator distinctions and moderation remain below while the wider platform controls continue to expand.
        </p>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        {toolGroups.map((group) => (
          <Link
            key={group.title}
            href={group.href}
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.06] sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="display-kicker">{group.label}</p>
              {group.alertCount > 0 ? (
                <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 text-xs font-semibold text-amber-100">
                  {group.alertCount}
                </span>
              ) : null}
            </div>
            <h2 className="headline-lg mt-3 text-foreground">{group.title}</h2>
            <p className="body-sm mt-3 text-muted-foreground">{group.description}</p>
            <p className="mt-5 text-sm uppercase tracking-[0.18em] text-primary/85">{group.cta}</p>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}

