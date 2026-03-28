import Link from "next/link";

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
    <section className="container-shell pt-4 sm:pt-6 lg:pt-7" data-reveal="hero">
      <div className="surface-panel cinema-frame relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8 lg:px-11 lg:py-10">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,7,12,0.78)_0%,rgba(6,7,12,0.46)_42%,rgba(6,7,12,0.62)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(214,188,136,0.08),transparent_20%),linear-gradient(180deg,rgba(4,4,8,0.08),rgba(4,4,8,0.24))]" />
        <div className="absolute inset-x-8 top-6 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
        <div className="absolute inset-y-0 right-0 hidden w-[34%] bg-[linear-gradient(270deg,rgba(255,255,255,0.04),transparent)] lg:block" />
        <div className="absolute inset-y-8 right-5 hidden w-[29%] rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,12,18,0.86),rgba(7,8,12,0.72))] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-sm lg:block">
          {spotlightFilm ? (
            <Link href={`/film/${spotlightFilm.slug}`} className="block h-full transition duration-300 hover:translate-y-[-2px]">
              <div className="flex h-full flex-col justify-between rounded-[21px] border border-white/10 bg-black/40 p-4">
                <div>
                  <p className="display-kicker">{spotlightLabel}</p>
                  <p className="mt-2 font-serif text-[1.6rem] font-semibold leading-tight text-foreground">
                    {spotlightFilm.title}
                  </p>
                  <p className="mt-3 text-sm text-foreground/72">by {spotlightCreatorName}</p>
                  <p className="mt-4 body-sm text-foreground/78">
                    {spotlightFilm.synopsis || "A newly published film on ArsGratia."}
                  </p>
                </div>

                <div className="mt-5 rounded-[18px] border border-white/10 bg-white/5 p-3">
                  <p className="display-kicker">Premiere</p>
                  <Button size="lg" className="pointer-events-none mt-3 self-start">
                    Watch film
                  </Button>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex h-full flex-col justify-between rounded-[21px] border border-white/10 bg-black/40 p-4">
              <div>
                <p className="display-kicker">First Release</p>
                <p className="mt-2 font-serif text-[1.6rem] font-semibold leading-tight text-foreground">
                  The first public films published on ArsGratia will appear here.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="public-home-hero-copy relative max-w-3xl lg:max-w-[58%]">
          <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,8,14,0.84),rgba(7,8,14,0.7))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-[3px] sm:p-5">
            <p className="display-kicker">{siteConfig.motto}</p>
            <p className="eyebrow mt-1.5 text-foreground/84">Art, for art's sake</p>
            <h1 className="hero-title mt-4 max-w-3xl text-balance">{siteConfig.heroTitle}</h1>
            <p className="mt-4 max-w-2xl body-lg text-foreground/84">{siteConfig.heroDescription}</p>
          </div>

          <div className="public-home-hero-actions mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3" data-reveal="hero-actions">
            <Button asChild size="xl" className="w-full sm:w-auto">
              <Link href="/feed">Watch New Work</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto bg-black/18 hover:bg-black/24">
              <Link href="/filmmakers">Browse Theatres</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto bg-black/18 hover:bg-black/24">
              <Link href="/signup">Become a Creator</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto bg-black/18 hover:bg-black/24">
              <Link href="/resources">Explore Resources</Link>
            </Button>
          </div>

          <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3" data-reveal="hero-panels">
            <div className="space-y-2 rounded-[20px] border border-white/10 bg-black/28 p-3.5 backdrop-blur-[2px] sm:p-4">
              <p className="display-kicker">Films</p>
              <p className="title-md text-foreground">Present the work cinematically</p>
              <p className="body-sm text-foreground/78">Upload, stream, and publish films in a frame that feels intentional.</p>
            </div>
            <div className="space-y-2 rounded-[20px] border border-white/10 bg-black/28 p-3.5 backdrop-blur-[2px] sm:p-4">
              <p className="display-kicker">Creators</p>
              <p className="title-md text-foreground">Own your profile and voice</p>
              <p className="body-sm text-foreground/78">Give each creator a home with authorship instead of generic platform chrome.</p>
            </div>
            <div className="space-y-2 rounded-[20px] border border-white/10 bg-black/28 p-3.5 backdrop-blur-[2px] sm:p-4">
              <p className="display-kicker">Resources</p>
              <p className="title-md text-foreground">Tie process to finished work</p>
              <p className="body-sm text-foreground/78">Discover tools, education, and communities that support the wider AI cinema ecosystem.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
