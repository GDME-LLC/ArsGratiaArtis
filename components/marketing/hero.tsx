import Link from "next/link";

import { HeroBackgroundVideo } from "@/components/marketing/hero-background-video";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/constants/site";
import { resolveCreatorName } from "@/lib/utils";
import type { PublicFilmCard } from "@/types";

type HeroProps = {
  spotlightFilm?: PublicFilmCard | null;
  spotlightLabel?: string;
};

export function Hero({ spotlightFilm, spotlightLabel = "Latest Release" }: HeroProps) {
  const spotlightCreatorName = spotlightFilm
    ? resolveCreatorName({
        handle: spotlightFilm.creator.handle,
        displayName: spotlightFilm.creator.displayName,
      })
    : null;

  return (
    <section className="container-shell pt-4 sm:pt-6 lg:pt-7">
      <div className="relative min-h-[72vh] overflow-hidden py-8 sm:py-10 lg:py-12">
        <HeroBackgroundVideo />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="public-home-hero-copy max-w-3xl">
            <p className="display-kicker">{siteConfig.motto}</p>
            <p className="eyebrow mt-2 text-foreground/88">Art, for art&apos;s sake</p>
            <h1 className="hero-title mt-4 max-w-3xl text-balance">{siteConfig.heroTitle}</h1>
            <p className="mt-4 max-w-2xl body-lg text-foreground/88">{siteConfig.heroDescription}</p>

            <div className="public-home-hero-actions mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="xl" className="w-full sm:w-auto">
                <Link href="/feed">Watch New Work</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto">
                <Link href="/filmmakers">Browse Theatres</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto">
                <Link href="/signup">Become a Creator</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto">
                <Link href="/resources">Explore Resources</Link>
              </Button>
            </div>

            <div className="public-home-hero-panels mt-10 grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <p className="display-kicker">Films</p>
                <p className="title-md text-foreground">Present the work cinematically</p>
                <p className="body-sm text-foreground/78">Upload, stream, and publish films in a frame that feels intentional.</p>
              </div>
              <div className="space-y-2">
                <p className="display-kicker">Creators</p>
                <p className="title-md text-foreground">Own your profile and voice</p>
                <p className="body-sm text-foreground/78">Give each creator a home with authorship instead of generic platform chrome.</p>
              </div>
              <div className="space-y-2">
                <p className="display-kicker">Resources</p>
                <p className="title-md text-foreground">Tie process to finished work</p>
                <p className="body-sm text-foreground/78">Discover tools, education, and communities that support the wider AI cinema ecosystem.</p>
              </div>
            </div>
          </div>

          <div className="public-home-hero-feature hidden lg:block lg:justify-self-end lg:text-right">
            <p className="display-kicker">{spotlightFilm ? spotlightLabel : "First Release"}</p>
            {spotlightFilm ? (
              <>
                <p className="mt-2 font-serif text-[1.55rem] font-semibold leading-tight text-foreground">
                  {spotlightFilm.title}
                </p>
                <p className="mt-3 text-sm text-foreground/72">by {spotlightCreatorName}</p>
                <p className="mt-4 body-sm text-foreground/76">
                  {spotlightFilm.synopsis || "A newly published film on ArsGratia."}
                </p>
                <Button asChild size="lg" variant="ghost" className="mt-5">
                  <Link href={`/film/${spotlightFilm.slug}`}>Watch film</Link>
                </Button>
              </>
            ) : (
              <p className="mt-2 font-serif text-[1.55rem] font-semibold leading-tight text-foreground">
                The first public films published on ArsGratia will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
