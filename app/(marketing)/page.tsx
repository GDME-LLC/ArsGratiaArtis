import Link from "next/link";

import { PublicFilmFeed } from "@/components/films/public-film-feed";
import { Hero } from "@/components/marketing/hero";
import { SectionShell } from "@/components/marketing/section-shell";
import { HorizontalRail } from "@/components/shared/horizontal-rail";
import { Button } from "@/components/ui/button";
import { BEYOND_CINEMA_CATEGORIES } from "@/lib/films/categories";
import { listCreatorsToWatch } from "@/lib/profiles";
import { listPublishedFilms, listStaffPickFilms } from "@/lib/services/films";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";
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
    <SectionShell className="mt-7">
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

  const [staffPickFilms, featuredFilmResponse, featuredBeyondResponse, newReleaseResponse, newExperimentsResponse, creatorsToWatch] = canLoad
    ? await Promise.all([
        listStaffPickFilms(8),
        listPublishedFilms({ page: 1, pageSize: 24, categories: ["film"], sortBy: "created_at" }),
        listPublishedFilms({
          page: 1,
          pageSize: 24,
          categories: BEYOND_CINEMA_CATEGORIES,
          sortBy: "likes",
        }),
        listPublishedFilms({ page: 1, pageSize: 24, sortBy: "created_at" }),
        listPublishedFilms({
          page: 1,
          pageSize: 24,
          categories: BEYOND_CINEMA_CATEGORIES,
          sortBy: "created_at",
        }),
        listCreatorsToWatch(8),
      ])
    : [
        [],
        { films: [], hasMore: false },
        { films: [], hasMore: false },
        { films: [], hasMore: false },
        { films: [], hasMore: false },
        [],
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

  const spotlightFilm = staffPicks[0] ?? featuredFilms[0] ?? newReleases[0] ?? featuredBeyondCinema[0] ?? newExperiments[0] ?? null;
  const spotlightLabel = staffPicks.length > 0 ? "Staff Pick" : featuredFilms.length > 0 ? "Featured Film" : "Latest Release";

  return (
    <div className="pb-20">
      <Hero spotlightFilm={spotlightFilm} spotlightLabel={spotlightLabel} />

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
        <SectionShell className="mt-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Creators to Watch</p>
              <h2 className="headline-lg mt-3 text-foreground">Creators to Watch</h2>
              <p className="body-lg mt-3">Filmmakers building momentum through releases, followership, and a visible body of work.</p>
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
                    className="surface-panel cinema-frame w-[min(82vw,21rem)] shrink-0 snap-start overflow-hidden p-5 sm:w-[20rem]"
                  >
                    <p className="display-kicker">Filmmaker</p>
                    <h3 className="title-md mt-3 text-foreground">{creator.displayName}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">@{creator.handle}</p>
                    <p className="body-sm mt-4 line-clamp-3">
                      {creator.bio || "A public filmmaker page is live, with releases and series beginning to take shape."}
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-[18px] border border-white/10 bg-white/5 p-3">
                        <p className="display-kicker">Followers</p>
                        <p className="mt-2 text-foreground">{creator.followerCount}</p>
                      </div>
                      <div className="rounded-[18px] border border-white/10 bg-white/5 p-3">
                        <p className="display-kicker">Films</p>
                        <p className="mt-2 text-foreground">{creator.publicFilmCount}</p>
                      </div>
                      <div className="rounded-[18px] border border-white/10 bg-white/5 p-3">
                        <p className="display-kicker">Series</p>
                        <p className="mt-2 text-foreground">{creator.seriesCount}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[20px] border border-white/10 bg-black/20 p-4">
                      <p className="display-kicker">Latest Release</p>
                      <p className="mt-3 text-sm text-foreground">
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
