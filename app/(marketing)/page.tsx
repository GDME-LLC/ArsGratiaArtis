import Link from "next/link";

import { PublicFilmFeed } from "@/components/films/public-film-feed";
import { Hero } from "@/components/marketing/hero";
import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { Button } from "@/components/ui/button";
import { listCuratedFilms, listPublishedFilms } from "@/lib/services/films";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

export default async function HomePage() {
  const staffPicks = hasSupabaseServerEnv()
    ? await listCuratedFilms({ pageSize: 3 })
    : [];
  const featuredFilms = hasSupabaseServerEnv()
    ? await listPublishedFilms({ page: 1, pageSize: 3 })
    : { films: [], hasMore: false };
  const spotlightFilm = staffPicks[0] ?? featuredFilms.films[0] ?? null;

  return (
    <div className="pb-20">
      <Hero spotlightFilm={spotlightFilm} spotlightLabel="Staff Pick" />

      <SectionShell className="mt-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Staff Picks</p>
            <h2 className="headline-lg mt-3 text-foreground">Staff Picks</h2>
            <p className="body-lg mt-3">Selected for craft, voice, or originality.</p>
          </div>
        </div>

        {staffPicks.length > 0 ? (
          <div className="mt-6">
            <PublicFilmFeed films={staffPicks} />
          </div>
        ) : null}
      </SectionShell>

      <SectionShell className="mt-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Featured Releases</p>
            <h2 className="headline-lg mt-3 text-foreground">Featured Releases</h2>
            <p className="body-lg mt-3">A rotating selection of standout work.</p>
          </div>
        </div>

        {staffPicks.length > 0 ? (
          <div className="mt-6">
            <PublicFilmFeed films={staffPicks} />
          </div>
        ) : null}
      </SectionShell>

      <SectionShell className="mt-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">New Releases</p>
            <h2 className="headline-lg mt-3 text-foreground">New Releases</h2>
            <p className="body-lg mt-3">Fresh films published on ArsGratia.</p>
          </div>
          <Button asChild size="lg" variant="ghost">
            <Link href="/feed">See the full feed</Link>
          </Button>
        </div>

        {featuredFilms.films.length > 0 ? (
          <div className="mt-6">
            <PublicFilmFeed films={featuredFilms.films} />
          </div>
        ) : (
          <div className="surface-panel mt-6 p-6">
            <p className="display-kicker">Coming Into View</p>
            <p className="title-md mt-3 text-foreground">The first public releases have not landed yet</p>
            <p className="body-sm mt-2">
              As invited creators begin publishing, this front page will surface the newest work here first.
            </p>
          </div>
        )}
      </SectionShell>

      <SectionShell className="mt-7 grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <PageIntro
          eyebrow="Meet the Filmmakers"
          title="Meet the Filmmakers"
          description="The people behind the films."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <article className="surface-panel p-5">
            <p className="display-kicker">Primary</p>
            <h3 className="title-md mt-3 text-foreground">Watch New Work</h3>
            <p className="body-sm mt-2">Start with recent releases and move directly into individual film pages.</p>
            <Button asChild size="lg" className="mt-4">
              <Link href="/feed">Watch New Work</Link>
            </Button>
          </article>
          <article className="surface-panel p-5">
            <p className="display-kicker">Profiles</p>
            <h3 className="title-md mt-3 text-foreground">Meet the Filmmakers</h3>
            <p className="body-sm mt-2">The filmmakers behind the work stay close to the releases, so discovery begins with the film rather than profile-chasing.</p>
            <Button asChild size="lg" variant="ghost" className="mt-4">
              <Link href="/feed">Meet the Filmmakers</Link>
            </Button>
          </article>
          <article className="surface-panel p-5">
            <p className="display-kicker">Context</p>
            <h3 className="title-md mt-3 text-foreground">Tools Behind the Work</h3>
            <p className="body-sm mt-2">Prompts, workflows, and tool choices connected to the films.</p>
            <Button asChild size="lg" variant="ghost" className="mt-4">
              <Link href="/resources">Open Resources</Link>
            </Button>
          </article>
          <article className="surface-panel p-5">
            <p className="display-kicker">Publishing</p>
            <h3 className="title-md mt-3 text-foreground">Start your release page</h3>
            <p className="body-sm mt-2">Claim a creator page, shape your public presence, and begin preparing your first film entry.</p>
            <Button asChild size="lg" variant="ghost" className="mt-4">
              <Link href="/signup">Become a Creator</Link>
            </Button>
          </article>
          <article className="surface-panel p-5">
            <p className="display-kicker">Editorial</p>
            <h3 className="title-md mt-3 text-foreground">Read the Manifesto</h3>
            <p className="body-sm mt-2">Read the editorial stance behind ArsGratia before you step further into the work.</p>
            <Button asChild size="lg" variant="ghost" className="mt-4">
              <Link href="/manifesto">Read the Manifesto</Link>
            </Button>
          </article>
        </div>
      </SectionShell>

    </div>
  );
}
