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
  title: string;
  description: string;
  films: PublicFilmCard[];
  href?: string;
  className?: string;
};

function ReleaseSection({ title, description, films, href, className }: ReleaseSectionProps) {
  if (films.length === 0) {
    return null;
  }

  return (
    <SectionShell className={className ?? "mt-6 sm:mt-7"}>
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="headline-lg text-foreground">{title}</h2>
          {href ? (
            <Button asChild size="lg" variant="ghost">
              <Link href={href}>{title}</Link>
            </Button>
          ) : null}
        </div>
        <p className="body-lg mt-3">{description}</p>
      </div>

      <div className="mt-6">
        <PublicFilmFeed films={films} variant="row" />
      </div>
    </SectionShell>
  );
}

function WorkflowSystemSection() {
  return (
    <SectionShell className="mt-6 sm:mt-7">
      <div className="surface-panel cinema-frame overflow-hidden p-4 sm:p-6 lg:p-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] lg:items-center">
          <div>
            <p className="eyebrow">Workflow Tool</p>
            <h2 className="headline-lg mt-3 text-foreground">Project-first creation inside Creator Studio</h2>
            <p className="body-lg mt-3 max-w-3xl">
              Workflow Tool is the upstream layer for creator work. Start the concept, structure direction, shape a draft,
              then move it into Creator Studio where Start a Project leads toward later release and publication.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-foreground/72 sm:text-[11px]">
              <span className="rounded-full border border-white/14 bg-black/25 px-3 py-1.5">Workflow Tool</span>
              <span className="text-foreground/50">-&gt;</span>
              <span className="rounded-full border border-white/14 bg-black/25 px-3 py-1.5">Saved Draft / Project</span>
              <span className="text-foreground/50">-&gt;</span>
              <span className="rounded-full border border-white/14 bg-black/25 px-3 py-1.5">Creator Studio</span>
              <span className="text-foreground/50">-&gt;</span>
              <span className="rounded-full border border-white/14 bg-black/25 px-3 py-1.5">Start a Project</span>
              <span className="text-foreground/50">-&gt;</span>
              <span className="rounded-full border border-white/14 bg-black/25 px-3 py-1.5">Release / Publish</span>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/25 p-5 sm:p-6">
            <p className="display-kicker">Creator Entry</p>
            <h3 className="title-md mt-3 text-foreground">Explore publicly, persist as a Creator</h3>
            <p className="body-sm mt-3">
              Public users can open Workflow Tool and begin shaping ideas. Save, draft, continue, and Studio transfer
              actions activate after becoming a Creator.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/workflow-tool">Open Workflow Tool</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
                <Link href="/signup">Become a Creator</Link>
              </Button>
            </div>
          </div>
        </div>
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

  const mobileLeadFilms = featuredFilms.length > 0 ? featuredFilms : newReleases.length > 0 ? newReleases : staffPicks;
  const mobileLeadVariant = featuredFilms.length > 0 ? "featured" : newReleases.length > 0 ? "new-releases" : "staff-picks";

  return (
    <div className="pb-20">
      <Hero
        spotlightFilm={spotlightFilm}
        spotlightLabel={spotlightLabel}
        heroContent={platformSettings.heroContent}
      />

      <ReleaseSection
        title={mobileLeadVariant === "featured" ? "Featured Films" : mobileLeadVariant === "new-releases" ? "New Releases" : "Staff Picks"}
        description={
          mobileLeadVariant === "featured"
            ? "A current selection of film releases worth settling into."
            : mobileLeadVariant === "new-releases"
              ? "The latest uploads arriving on ArsNeos, newest first."
              : "Selected by the ArsNeos team for authorship, craft, or originality."
        }
        films={mobileLeadFilms}
        href="/feed"
        className="mt-6 sm:hidden"
      />

      <WorkflowSystemSection />

      {foundingCreators.length > 0 ? (
        <SectionShell className="mt-6 sm:mt-7">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] xl:items-start">
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-3xl">
                  <p className="eyebrow">Founding Creators</p>
                  <h2 className="headline-lg mt-3 text-foreground">Founding Creators</h2>
                  <p className="body-lg mt-3">
                    A permanent roster of the artists helping define ArsNeos's beginning. The first 20 creators will remain part of the platform's founding record.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <HorizontalRail ariaLabel="founding creators">
                  {foundingCreators.map((creator) => (
                    <Link
                      key={creator.id}
                      href={`/creator/${creator.handle}`}
                      className="cinema-frame flex w-[min(84vw,19rem)] shrink-0 snap-start flex-col overflow-hidden rounded-none border border-white/30 bg-black p-4 shadow-[0_14px_34px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(116,124,136,0.3)] sm:w-[18rem] sm:p-5"
                    >
                      <div
                        className="h-36 rounded-none border border-white/12 bg-white/5 bg-cover bg-center"
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
                        {creator.bio || "One of the first artists helping shape ArsNeos's founding era."}
                      </p>
                      <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 text-sm text-muted-foreground">
                        <div className="min-w-0 rounded-none border border-white/12 bg-black/20 px-4 py-3">
                          <p className="text-[10px] uppercase tracking-[0.1em] text-primary/82 sm:text-[11px] sm:tracking-[0.18em]">Releases</p>
                          <p className="mt-2 break-words text-[0.98rem] font-semibold leading-tight text-foreground sm:text-lg">{formatCountLabel(creator.publicFilmCount, "release")}</p>
                        </div>
                        <div className="min-w-0 rounded-none border border-white/12 bg-black/20 px-4 py-3">
                          <p className="text-[10px] uppercase tracking-[0.1em] text-primary/82 sm:text-[11px] sm:tracking-[0.18em]">Followers</p>
                          <p className="mt-2 break-words text-[0.98rem] font-semibold leading-tight text-foreground sm:text-lg">{formatFollowerCount(creator.followerCount)}</p>
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
              description="A prestige cohort reserved for the creators who help establish ArsNeos's standards, authorship, and early public identity."
            />
          </div>
        </SectionShell>
      ) : null}

      <ReleaseSection
        title="Staff Picks"
        description="Selected by the ArsNeos team for authorship, craft, or originality."
        films={staffPicks}
      />

      <ReleaseSection
        title="Featured Films"
        description="A current selection of film releases worth settling into."
        films={featuredFilms}
        href="/feed"
        className="hidden sm:block sm:mt-7"
      />

      <ReleaseSection
        title="Featured Beyond Cinema"
        description="Animation, experimental work, commentary, and commissioned pieces drawing attention now."
        films={featuredBeyondCinema}
        href="/beyond-cinema"
      />

      <ReleaseSection
        title="New Releases"
        description="The latest uploads arriving on ArsNeos, newest first."
        films={newReleases}
        href="/feed"
        className={mobileLeadVariant === "new-releases" ? "hidden sm:block sm:mt-7" : undefined}
      />

      <ReleaseSection
        title="New Experiments"
        description="The newest AI-generated work beyond traditional cinema."
        films={newExperiments}
        href="/beyond-cinema"
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
                    className="cinema-frame w-[min(86vw,21rem)] shrink-0 snap-start overflow-hidden rounded-none border border-white/30 bg-black p-4 shadow-[0_14px_34px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(116,124,136,0.3)] sm:w-[20rem] sm:p-5"
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

                    <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 text-sm">
                      <div className="min-w-0 rounded-none border border-white/12 bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-[0.1em] text-primary/82 sm:text-[11px] sm:tracking-[0.18em]">Followers</p>
                        <p className="mt-2 break-words text-[0.98rem] font-semibold leading-tight text-foreground sm:text-lg">{formatFollowerCount(creator.followerCount)}</p>
                      </div>
                      <div className="min-w-0 rounded-none border border-white/12 bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-[0.1em] text-primary/82 sm:text-[11px] sm:tracking-[0.18em]">Releases</p>
                        <p className="mt-2 break-words text-[0.98rem] font-semibold leading-tight text-foreground sm:text-lg">{formatCountLabel(creator.publicFilmCount, "release")}</p>
                      </div>
                    </div>

                    <div className="mt-5 min-w-0 rounded-none border border-white/12 bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-primary/82 sm:text-[11px] sm:tracking-[0.18em]">Latest Release</p>
                      <p className="mt-3 break-words text-sm text-foreground">
                        {latestRelease?.title ?? "No public releases yet."}
                      </p>
                    </div>

                    <Button asChild size="lg" variant="ghost" className="mt-5 w-full min-w-0">
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








