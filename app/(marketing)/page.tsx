import Link from "next/link";

import { PublicFilmFeed } from "@/components/films/public-film-feed";
import { Hero } from "@/components/marketing/hero";
import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { Button } from "@/components/ui/button";
import { listPublishedFilms } from "@/lib/services/films";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

const featuredRows = [
  {
    title: "Releases with a point of view",
    description:
      "Watch work that arrives with tone, authorship, and a stronger sense of release.",
  },
  {
    title: "Useful craft context, not software clutter",
    description:
      "Move from finished films into selected tools, workflows, and notes that actually help creators make better work.",
  },
  {
    title: "A public surface built for invited creators",
    description:
      "Each page is meant to feel release-ready from the first poster, not like a draft hidden inside a dashboard.",
  },
];

export default async function HomePage() {
  const featuredFilms = hasSupabaseServerEnv()
    ? await listPublishedFilms({ page: 1, pageSize: 3 })
    : { films: [], hasMore: false };

  return (
    <div className="pb-20">
      <Hero />

      <SectionShell className="mt-4 grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <PageIntro
          eyebrow="Start Here"
          title="Start with the work, then follow the voice behind it."
          description="Browse recent releases, move into creator pages, or set up your own presence with the same dark, considered frame the films receive."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <article className="surface-panel p-5">
            <p className="display-kicker">Primary</p>
            <h3 className="title-md mt-3 text-foreground">Explore Films</h3>
            <p className="body-sm mt-2">Start with recent releases and move directly into individual film pages.</p>
            <Button asChild size="lg" className="mt-4">
              <Link href="/feed">Browse releases</Link>
            </Button>
          </article>
          <article className="surface-panel p-5">
            <p className="display-kicker">Profiles</p>
            <h3 className="title-md mt-3 text-foreground">Browse Creators</h3>
            <p className="body-sm mt-2">Creator pages stay close to the films, so discovery begins with the work rather than profile-chasing.</p>
            <Button asChild size="lg" variant="ghost" className="mt-4">
              <Link href="/feed">Find creators through films</Link>
            </Button>
          </article>
          <article className="surface-panel p-5">
            <p className="display-kicker">Publishing</p>
            <h3 className="title-md mt-3 text-foreground">Start your release page</h3>
            <p className="body-sm mt-2">Claim a creator page, shape your public presence, and begin preparing your first film entry.</p>
            <Button asChild size="lg" variant="ghost" className="mt-4">
              <Link href="/signup">Start your creator page</Link>
            </Button>
          </article>
          <article className="surface-panel p-5">
            <p className="display-kicker">Context</p>
            <h3 className="title-md mt-3 text-foreground">Read the Manifesto</h3>
            <p className="body-sm mt-2">Read the editorial stance behind ArsGratia before you step further into the work.</p>
            <Button asChild size="lg" variant="ghost" className="mt-4">
              <Link href="/manifesto">Read the manifesto</Link>
            </Button>
          </article>
        </div>
      </SectionShell>

      <SectionShell className="mt-7">
        <div className="grid gap-3 md:grid-cols-3">
          {featuredRows.map((item) => (
            <article key={item.title} className="surface-panel p-5">
              <h3 className="title-md text-foreground">
                {item.title}
              </h3>
              <p className="body-sm mt-2 max-w-xl">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell className="mt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <PageIntro
            eyebrow="Discover"
            title="Recent releases from across ArsGratia."
            description="A public selection of newly released work, arranged to stay browseable while still giving each film some atmosphere."
          />
          <Button asChild size="lg" variant="ghost">
            <Link href="/feed">See the full feed</Link>
          </Button>
        </div>

        {featuredFilms.films.length > 0 ? (
          <div className="mt-7">
            <PublicFilmFeed films={featuredFilms.films} />
          </div>
        ) : (
          <div className="surface-panel mt-7 p-6">
            <p className="display-kicker">Coming Into View</p>
            <p className="title-md mt-3 text-foreground">The first public releases have not landed yet</p>
            <p className="body-sm mt-2">
              As invited creators begin publishing, this front page will surface the newest work here first.
            </p>
          </div>
        )}
      </SectionShell>
    </div>
  );
}
