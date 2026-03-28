import Link from "next/link";

import { PublicFilmFeed } from "@/components/films/public-film-feed";
import { CreatorBadgeList } from "@/components/badges/creator-badge-list";
import { FoundingCreatorBenefits } from "@/components/founding/founding-creator-benefits";
import { Hero } from "@/components/marketing/hero";
import { SectionShell } from "@/components/marketing/section-shell";
import { HorizontalRail } from "@/components/shared/horizontal-rail";
import { Button } from "@/components/ui/button";
import { getDefaultPlatformSettings, getPlatformSettings, resolveHomepageSpotlight } from "@/lib/platform-settings";
import { listFeaturedFoundingCreators } from "@/lib/founding-creators";
import { listCreatorsToWatch } from "@/lib/profiles";
import { getPublicFilmCardById, listPublishedFilms, listStaffPickFilms } from "@/lib/services/films";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";
import { formatCountLabel, formatFollowerCount } from "@/lib/utils";
import type { PublicFilmCard } from "@/types";

function filterDistinct(films: PublicFilmCard[], excludedIds: Set<string>, limit: number) {
  return films.filter((film) => !excludedIds.has(film.id)).slice(0, limit);
}

type ReleaseSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  films: PublicFilmCard[];
  href?: string;
  ctaLabel?: string;
};

function ReleaseSection({ eyebrow, title, description, films, href, ctaLabel }: ReleaseSectionProps) {
  if (films.length === 0) {
    return null;
  }

  return (
    <SectionShell className="mt-6 sm:mt-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="headline-lg mt-3 text-foreground">{title}</h2>
          <p className="body-lg mt-3">{description}</p>
        </div>
        {href && ctaLabel ? (
          <Button asChild size="lg" variant="ghost">
            <Link href={href}>{ctaLabel}</Link>
          </Button>
        ) : null}
      </div>

      <div className="mt-6">
        <PublicFilmFeed films={films} variant="row" />
      </div>
    </SectionShell>
  );
}

export default async function HomePage() {
  const canLoad = hasSupabaseServerEnv();
  const platformSettings = canLoad ? await getPlatformSettings() : getDefaultPlatformSettings();
  const beyondCinemaCategories = platformSettings.beyondCinemaCategories;

  const [foundingCreators, staffPickFilms, featuredFilmResponse, featuredBeyondResponse, newReleaseResponse, newExperimentsResponse, creatorsToWatch, manualSpotlightFilm] = canLoad
    ? await Promise.all([
        listFeaturedFoundingCreators(20),
        listStaffPickFilms(8),
        listPublishedFilms({ page: 1, pageSize: 24, categories: ["film"], sortBy: "created_at" }),
        listPublishedFilms({
          page: 1,
          pageSize: 24,
          categories: beyondCinemaCategories,
          sortBy: "likes",
        }),
        listPublishedFilms({ page: 1, pageSize: 24, sortBy: "created_at" }),
        listPublishedFilms({
          page: 1,
          pageSize: 24,
          categories: beyondCinemaCategories,
          sortBy: "created_at",
        }),
        listCreatorsToWatch(8),
        platformSettings.homepageSpotlightFilmId ? getPublicFilmCardById(platformSettings.homepageSpotlightFilmId) : Promise.resolve(null),
      ])
    : [
        [],
        [],
        { films: [], hasMore: false },
        { films: [], hasMore: false },
        { films: [], hasMore: false },
        { films: [], hasMore: false },
        [],
        null,
      ];

  const usedFilmIds = new Set<string>();
  const staffPicks = filterDistinct(staffPickFilms, usedFilmIds, 8);
  staffPicks.forEach((film) => usedFilmIds.add(film.id));

  const featuredFilms = filterDistinct(featuredFilmResponse.films, usedFilmIds, 12);
  featuredFilms.forEach((film) => usedFilmIds.add(film.id));

  const featuredBeyondCinema = filterDistinct(featuredBeyondResponse.films, usedFilmIds, 12);
  featuredBeyondCinema.forEach((film) => usedFilmIds.add(film.id));

  const newReleases = filterDistinct(newReleaseResponse.films, usedFilmIds, 12);
  newReleases.forEach((film) => usedFilmIds.add(film.id));

  const newExperiments = filterDistinct(newExperimentsResponse.films, usedFilmIds, 12);

  const automaticSpotlightFilm = staffPicks[0] ?? featuredFilms[0] ?? newReleases[0] ?? featuredBeyondCinema[0] ?? newExperiments[0] ?? null;
  const automaticSpotlightLabel = staffPicks.length > 0 ? "Staff Pick" : featuredFilms.length > 0 ? "Featured Film" : "Latest Release";
  const { spotlightFilm, spotlightLabel } = resolveHomepageSpotlight(
    platformSettings,
    manualSpotlightFilm,
    automaticSpotlightFilm,
    automaticSpotlightLabel,
  );

  return (
    <div className="pb-20">
      <Hero
        spotlightFilm={spotlightFilm}
        spotlightLabel={spotlightLabel}
        motto={platformSettings.heroMotto}
        title={platformSettings.heroTitle}
        description={platformSettings.heroDescription}
      />

      {foundingCreators.length > 0 ? (
        <SectionShell className="mt-6 sm:mt-7">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] xl:items-start">
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-3xl">
                  <p className="eyebrow">Founding Creators</p>
                  <h2 className="headline-lg mt-3 text-foreground">Founding Creators</h2>
                  <p className="body-lg mt-3">
                    A permanent roster of the artists helping define ArsGratia's beginning. The first 20 creators will remain part of the platform's founding record.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <HorizontalRail ariaLabel="founding creators">
                  {foundingCreators.map((creator) => (
                    <Link
                      key={creator.id}
                      href={`/creator/${creator.handle}`}
                      className="surface-panel cinema-frame flex w-[min(84vw,19rem)] shrink-0 snap-start flex-col overflow-hidden p-4 sm:w-[18rem] sm:p-5"
                    >
                      <div
                        className="h-36 rounded-[20px] border border-white/10 bg-white/5 bg-cover bg-center"
                        style={
                          creator.bannerUrl
                            ? { backgroundImage: `linear-gradient(rgba(4,4,6,0.2), rgba(4,4,6,0.78)), url(${creator.bannerUrl})` }
                            : undefined
                        }
                      />
                      <div className="mt-4 flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-foreground"
                          style={creator.avatarUrl ? { backgroundImage: `url(${creator.avatarUrl})`, backgroundSize: "cover" } : undefined}
                        >
                          {!creator.avatarUrl ? creator.displayName.charAt(0).toUpperCase() : null}
                        </div>
                        <CreatorBadgeList badges={creator.badges} />
                      </div>
                      <h3 className="title-md mt-4 break-words text-foreground">{creator.displayName}</h3>
                      <p className="mt-2 break-all text-sm text-muted-foreground">@{creator.handle}</p>
                      <p className="body-sm mt-4 line-clamp-3 flex-1">
                        {creator.bio || "One of the first artists helping shape ArsGratia's founding era."}
                      </p>
                      <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-muted-foreground min-[420px]:grid-cols-2">
                        <div className="min-w-0 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-primary/82 sm:text-[11px] sm:tracking-[0.22em]">Releases</p>
                          <p className="mt-2 break-words text-base font-semibold text-foreground sm:text-lg">{formatCountLabel(creator.publicFilmCount, "release")}</p>
                        </div>
                        <div className="min-w-0 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-primary/82 sm:text-[11px] sm:tracking-[0.22em]">Followers</p>
                          <p className="mt-2 break-words text-base font-semibold text-foreground sm:text-lg">{formatFollowerCount(creator.followerCount)}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">
                        {creator.latestReleaseTitle ? `Latest release: ${creator.latestReleaseTitle}` : "Profile building now"}
                      </p>
                    </Link>
                  ))}
                </HorizontalRail>
              </div>
            </div>

            <FoundingCreatorBenefits
              title="The First 20"
              description="A prestige cohort reserved for the creators who help establish ArsGratia's standards, authorship, and early public identity."
            />
          </div>
        </SectionShell>
      ) : null}

      <ReleaseSection
        eyebrow="Staff Picks"
        title="Staff Picks"
        description="Selected by the ArsGratia team for authorship, craft, or originality."
        films={staffPicks}
      />

      <ReleaseSection
        eyebrow="Featured Films"
        title="Featured Films"
        description="A current selection of film releases worth settling into."
        films={featuredFilms}
        href="/feed"
        ctaLabel="Browse all releases"
      />

      <ReleaseSection
        eyebrow="Featured Beyond Cinema"
        title="Featured Beyond Cinema"
        description="Animation, experimental work, commentary, and commissioned pieces drawing attention now."
        films={featuredBeyondCinema}
        href="/beyond-cinema"
        ctaLabel="Enter Beyond Cinema"
      />

      <ReleaseSection
        eyebrow="New Releases"
        title="New Releases"
        description="The latest uploads arriving on ArsGratia, newest first."
        films={newReleases}
        href="/feed"
        ctaLabel="See the full feed"
      />

      <ReleaseSection
        eyebrow="New Experiments"
        title="New Experiments"
        description="The newest AI-generated work beyond traditional cinema."
        films={newExperiments}
        href="/beyond-cinema"
        ctaLabel="Browse Beyond Cinema"
      />

      {creatorsToWatch.length > 0 ? (
        <SectionShell className="mt-6 sm:mt-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Creators to Watch</p>
              <h2 className="headline-lg mt-3 text-foreground">Creators to Watch</h2>
              <p className="body-lg mt-3">
                Filmmakers building momentum through releases, followership, and a visible body of work.
              </p>
            </div>
            <Button asChild size="lg" variant="ghost">
              <Link href="/filmmakers">Meet the Filmmakers</Link>
            </Button>
          </div>

          <div className="mt-6">
            <HorizontalRail ariaLabel="creators to watch">
              {creatorsToWatch.map((creator) => {
                const latestRelease = creator.featuredReleases[0] ?? null;

                return (
                  <article
                    key={creator.id}
                    className="surface-panel cinema-frame w-[min(86vw,21rem)] shrink-0 snap-start overflow-hidden p-4 sm:w-[20rem] sm:p-5"
                  >
                    <p className="display-kicker">Filmmaker</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <h3 className="title-md min-w-0 break-words text-foreground">{creator.displayName}</h3>
                      <CreatorBadgeList badges={creator.badges} />
                    </div>
                    <p className="mt-2 break-all text-sm text-muted-foreground">@{creator.handle}</p>
                    <p className="body-sm mt-4 line-clamp-3">
                      {creator.bio || "A public filmmaker page is live, with releases and series beginning to take shape."}
                    </p>

                    <div className="mt-5 grid gap-3 text-sm min-[420px]:grid-cols-2 lg:grid-cols-3">
                      <div className="min-w-0 rounded-[18px] border border-white/10 bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-primary/82 sm:text-[11px] sm:tracking-[0.22em]">Followers</p>
                        <p className="mt-2 break-words text-base font-semibold text-foreground sm:text-lg">{formatFollowerCount(creator.followerCount)}</p>
                      </div>
                      <div className="min-w-0 rounded-[18px] border border-white/10 bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-primary/82 sm:text-[11px] sm:tracking-[0.22em]">Films</p>
                        <p className="mt-2 break-words text-base font-semibold text-foreground sm:text-lg">{formatCountLabel(creator.publicFilmCount, "release")}</p>
                      </div>
                      <div className="min-w-0 rounded-[18px] border border-white/10 bg-white/5 p-3 min-[420px]:col-span-2 lg:col-span-1">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-primary/82 sm:text-[11px] sm:tracking-[0.22em]">Series</p>
                        <p className="mt-2 break-words text-base font-semibold text-foreground sm:text-lg">{formatCountLabel(creator.seriesCount, "series", "series")}</p>
                      </div>
                    </div>

                    <div className="mt-5 min-w-0 rounded-[20px] border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-primary/82 sm:text-[11px] sm:tracking-[0.22em]">Latest Release</p>
                      <p className="mt-3 break-words text-sm text-foreground">
                        {latestRelease?.title ?? "No public releases yet."}
                      </p>
                    </div>

                    <Button asChild size="lg" variant="ghost" className="mt-5">
                      <Link href={`/creator/${creator.handle}`}>View filmmaker</Link>
                    </Button>
                  </article>
                );
              })}
            </HorizontalRail>
          </div>
        </SectionShell>
      ) : null}
    </div>
  );
}





