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

const heroHighlights = [
  {
    kicker: "Films",
    title: "Release work with gravity",
    description: "Publish films inside a frame that feels deliberate, watchable, and worthy of the premiere.",
  },
  {
    kicker: "Creators",
    title: "Build a theatre around authorship",
    description: "Give each filmmaker a public presence that reads like a body of work instead of a profile stub.",
  },
  {
    kicker: "Resources",
    title: "Stay close to the wider field",
    description: "Keep the best tools, research, and communities nearby without letting them overwhelm the films themselves.",
  },
] as const;

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
                <Link href="/filmmakers">Meet the Filmmakers</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto">
                <Link href="/resources">Explore Resources</Link>
              </Button>
            </div>

            <div className="public-home-hero-panels mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
              {heroHighlights.map((item) => (
                <div
                  key={item.kicker}
                  className="rounded-[24px] border border-white/8 bg-black px-5 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.34)]"
                >
                  <p className="display-kicker">{item.kicker}</p>
                  <p className="title-md mt-3 text-foreground">{item.title}</p>
                  <p className="body-sm mt-3 text-foreground/76">{item.description}</p>
                </div>
              ))}
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
