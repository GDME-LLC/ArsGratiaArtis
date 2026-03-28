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
    <section className="container-shell pt-4 sm:pt-6 lg:pt-7" data-reveal="hero">
      <div className="relative overflow-hidden bg-transparent px-5 py-7 sm:px-8 sm:py-8 lg:px-11 lg:py-10">
        <HeroBackgroundVideo />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_72%_14%,rgba(199,166,106,0.12),transparent_22%),linear-gradient(135deg,rgba(9,10,18,0.12),rgba(9,10,18,0.48))]" />
        <div className="absolute bottom-[12%] left-[7%] h-24 w-24 rounded-full bg-primary/10 blur-3xl sm:h-28 sm:w-28" />
        <div className="absolute right-[12%] top-[14%] h-28 w-28 rounded-full bg-accent/10 blur-3xl sm:h-36 sm:w-36" />
        <div className="absolute inset-y-0 right-0 hidden w-[36%] bg-[linear-gradient(270deg,rgba(255,255,255,0.06),transparent)] lg:block" />
        <div className="public-home-hero-feature absolute inset-y-8 right-5 hidden w-[29%] rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,13,20,0.72),rgba(7,7,11,0.38))] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.32)] backdrop-blur-[2px] lg:block">
          {spotlightFilm ? (
            <Link href={`/film/${spotlightFilm.slug}`} className="block h-full transition duration-500 hover:translate-y-[-2px] hover:scale-[1.01]">
              <div className="flex h-full flex-col justify-between rounded-[21px] border border-white/10 bg-black/24 p-4">
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
            <div className="flex h-full flex-col justify-between rounded-[21px] border border-white/10 bg-black/24 p-4">
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
          <div className="max-w-3xl">
            <p className="display-kicker">{siteConfig.motto}</p>
            <p className="eyebrow mt-1.5 text-foreground/86">Art, for art's sake</p>
            <h1 className="hero-title mt-4 max-w-3xl text-balance">{siteConfig.heroTitle}</h1>
            <p className="mt-4 max-w-2xl body-lg text-foreground/88">{siteConfig.heroDescription}</p>
          </div>

          <div className="public-home-hero-actions mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
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

          <div className="public-home-hero-panels mt-5 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
            <div className="space-y-2 rounded-[20px] border border-white/10 bg-black/18 p-3.5 backdrop-blur-[2px] sm:p-4">
              <p className="display-kicker">Films</p>
              <p className="title-md text-foreground">Present the work cinematically</p>
              <p className="body-sm text-foreground/78">Upload, stream, and publish films in a frame that feels intentional.</p>
            </div>
            <div className="space-y-2 rounded-[20px] border border-white/10 bg-black/18 p-3.5 backdrop-blur-[2px] sm:p-4">
              <p className="display-kicker">Creators</p>
              <p className="title-md text-foreground">Own your profile and voice</p>
              <p className="body-sm text-foreground/78">Give each creator a home with authorship instead of generic platform chrome.</p>
            </div>
            <div className="space-y-2 rounded-[20px] border border-white/10 bg-black/18 p-3.5 backdrop-blur-[2px] sm:p-4">
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
