import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/constants/site";
import type { PublicFilmCard } from "@/types";

type HeroProps = {
  spotlightFilm?: PublicFilmCard | null;
  spotlightLabel?: string;
};

export function Hero({ spotlightFilm, spotlightLabel = "Latest Release" }: HeroProps) {
  return (
    <section className="container-shell pt-5 sm:pt-6 lg:pt-7">
      <div className="surface-panel cinema-frame relative overflow-hidden px-5 py-7 sm:px-8 sm:py-8 lg:px-11 lg:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(199,166,106,0.12),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(149,52,80,0.12),transparent_20%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_42%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-[32%] bg-[radial-gradient(circle_at_center,rgba(199,166,106,0.08),transparent_56%)] lg:block" />
        <div className="absolute left-[8%] top-[14%] h-16 w-16 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[10%] right-[18%] h-20 w-20 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-5 top-5 hidden h-[calc(100%-2.5rem)] w-[27%] rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.012))] p-3 lg:block">
          <div className="flex h-full flex-col justify-between rounded-[18px] border border-white/8 bg-black/18 p-4">
            <div>
              <p className="display-kicker">{spotlightFilm ? spotlightLabel : "First Release"}</p>
              {spotlightFilm ? (
                <>
                  <p className="mt-2 font-serif text-[1.55rem] font-semibold leading-tight text-foreground">
                    {spotlightFilm.title}
                  </p>
                  <p className="mt-3 text-sm text-foreground/85">
                    {spotlightFilm.creator.displayName || `@${spotlightFilm.creator.handle}`}
                  </p>
                  <p className="mt-3 body-sm">
                    {spotlightFilm.synopsis || "A newly published film on ArsGratia."}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 font-serif text-[1.55rem] font-semibold leading-tight text-foreground">
                    The first public films published on ArsGratia will appear here.
                  </p>
                </>
              )}
            </div>
            {spotlightFilm ? (
              <Button asChild size="lg" className="self-start">
                <Link href={`/film/${spotlightFilm.slug}`}>Watch film</Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="relative max-w-3xl lg:max-w-[58%]">
          <p className="display-kicker">{siteConfig.motto}</p>
          <p className="eyebrow mt-2">Independent cinema, presented with intent</p>
          <h1 className="hero-title mt-3.5 max-w-3xl text-balance">
            {siteConfig.heroTitle}
          </h1>
          <p className="mt-3.5 max-w-2xl body-lg">{siteConfig.heroDescription}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="xl">
              <Link href="/feed">Watch New Work</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/feed">Meet the Filmmakers</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/signup">Become a Creator</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/manifesto">Read the Manifesto</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-3 border-t border-white/10 pt-3.5 sm:grid-cols-3">
            <div className="space-y-2">
              <p className="display-kicker">Films</p>
              <p className="title-md text-foreground">Present the work cinematically</p>
              <p className="body-sm">Upload, stream, and publish films in a frame that feels intentional.</p>
            </div>
            <div className="space-y-2">
              <p className="display-kicker">Creators</p>
              <p className="title-md text-foreground">Own your profile and voice</p>
              <p className="body-sm">Give each creator a home with authorship instead of generic platform chrome.</p>
            </div>
            <div className="space-y-2">
              <p className="display-kicker">Resources</p>
              <p className="title-md text-foreground">Tie process to finished work</p>
              <p className="body-sm">Surface tools and references that deepen how viewers engage with the film.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
