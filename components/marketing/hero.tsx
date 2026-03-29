import Link from "next/link";

import { getFilmArtworkUrl } from "@/lib/films/artwork";
import {
  getDefaultHeroContentSettings,
  HERO_PANEL_ORDER,
  type HeroContentSettings,
  type HeroCopyColor,
  type HeroCopySize,
} from "@/lib/platform-settings-shared";
import { HeroBackgroundVideo } from "@/components/marketing/hero-background-video";
import { Button } from "@/components/ui/button";
import { cn, resolveCreatorName } from "@/lib/utils";
import type { PublicFilmCard } from "@/types";

type HeroProps = {
  spotlightFilm?: PublicFilmCard | null;
  spotlightLabel?: string;
  heroContent?: HeroContentSettings;
};

const toneClassMap: Record<HeroCopyColor, string> = {
  gold: "text-primary/85",
  ivory: "text-foreground",
  soft: "text-foreground/88",
  muted: "text-muted-foreground",
  rose: "text-accent/90",
  slate: "text-foreground/72",
};

const aboveFoldSizeClassMap = {
  motto: {
    sm: "text-[0.62rem] tracking-[0.24em] sm:text-[0.66rem] sm:tracking-[0.3em]",
    md: "text-[0.68rem] tracking-[0.28em] sm:text-[0.72rem] sm:tracking-[0.36em]",
    lg: "text-[0.78rem] tracking-[0.3em] sm:text-[0.84rem] sm:tracking-[0.4em]",
  },
  submotto: {
    sm: "text-[0.72rem] tracking-[0.18em] sm:text-[0.78rem] sm:tracking-[0.22em]",
    md: "text-[0.78rem] tracking-[0.2em] sm:text-[0.84rem] sm:tracking-[0.26em]",
    lg: "text-[0.86rem] tracking-[0.22em] sm:text-[0.92rem] sm:tracking-[0.28em]",
  },
  title: {
    sm: "text-[2.15rem] leading-[0.98] tracking-[-0.04em] sm:text-[3rem] lg:text-[3.3rem]",
    md: "text-[2.5rem] leading-[0.98] tracking-[-0.045em] sm:text-5xl lg:text-[3.5rem]",
    lg: "text-[2.9rem] leading-[0.96] tracking-[-0.05em] sm:text-[4.05rem] lg:text-[4.6rem]",
  },
  description: {
    sm: "text-[0.94rem] leading-6 sm:text-[1rem] sm:leading-7",
    md: "text-[0.98rem] leading-7 sm:text-[1.05rem]",
    lg: "text-[1.06rem] leading-7 sm:text-[1.14rem] sm:leading-8",
  },
} as const;

const panelSizeClassMap = {
  kicker: {
    sm: "text-[0.62rem] tracking-[0.22em]",
    md: "text-[0.68rem] tracking-[0.28em]",
    lg: "text-[0.76rem] tracking-[0.32em]",
  },
  title: {
    sm: "text-[1rem] tracking-[-0.02em]",
    md: "text-[1.08rem] tracking-[-0.03em] sm:text-xl",
    lg: "text-[1.18rem] tracking-[-0.035em] sm:text-[1.4rem]",
  },
  description: {
    sm: "text-[0.82rem] leading-5",
    md: "text-sm leading-6",
    lg: "text-[0.98rem] leading-7",
  },
} as const;

function getAboveFoldLineClass(slot: keyof typeof aboveFoldSizeClassMap, color: HeroCopyColor, size: HeroCopySize) {
  return cn(
    slot === "title" ? "font-serif font-semibold text-balance" : "font-sans font-medium",
    slot === "motto" || slot === "submotto" ? "uppercase" : "",
    toneClassMap[color],
    aboveFoldSizeClassMap[slot][size],
  );
}

function getPanelLineClass(slot: keyof typeof panelSizeClassMap, color: HeroCopyColor, size: HeroCopySize) {
  return cn(
    slot === "title" ? "font-serif font-semibold" : "font-sans",
    slot === "kicker" ? "uppercase font-medium" : slot === "description" ? "font-normal" : "",
    toneClassMap[color],
    panelSizeClassMap[slot][size],
  );
}

export function Hero({
  spotlightFilm,
  spotlightLabel = "Latest Release",
  heroContent = getDefaultHeroContentSettings(),
}: HeroProps) {
  const spotlightCreatorName = spotlightFilm
    ? resolveCreatorName({
        handle: spotlightFilm.creator.handle,
        displayName: spotlightFilm.creator.displayName,
      })
    : null;
  const spotlightArtworkUrl = spotlightFilm
    ? getFilmArtworkUrl({
        posterUrl: spotlightFilm.posterUrl,
        muxPlaybackId: spotlightFilm.muxPlaybackId,
      })
    : null;

  return (
    <section className="container-shell pt-2 sm:pt-3 lg:pt-4">
      <div className="relative min-h-[68vh] overflow-hidden py-6 sm:py-7 lg:py-8">
        <HeroBackgroundVideo />

        <div className="relative z-10 grid gap-8 lg:-translate-y-14 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
          <div className="public-home-hero-copy max-w-3xl drop-shadow-[0_10px_32px_rgba(0,0,0,0.5)]">
            {heroContent.motto.text.trim() ? (
              <p className={getAboveFoldLineClass("motto", heroContent.motto.color, heroContent.motto.size)}>{heroContent.motto.text}</p>
            ) : null}
            {heroContent.submotto.text.trim() ? (
              <p className={cn("mt-2", getAboveFoldLineClass("submotto", heroContent.submotto.color, heroContent.submotto.size))}>
                {heroContent.submotto.text}
              </p>
            ) : null}
            {heroContent.title.text.trim() ? (
              <h1 className={cn("mt-4 max-w-3xl", getAboveFoldLineClass("title", heroContent.title.color, heroContent.title.size))}>
                {heroContent.title.text}
              </h1>
            ) : null}
            {heroContent.description.text.trim() ? (
              <p className={cn("mt-4 max-w-2xl", getAboveFoldLineClass("description", heroContent.description.color, heroContent.description.size))}>
                {heroContent.description.text}
              </p>
            ) : null}

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

            <div className="public-home-hero-panels mt-8 grid gap-5 sm:grid-cols-3 sm:gap-6">
              {HERO_PANEL_ORDER.map((panelKey) => {
                const panel = heroContent.panels[panelKey];

                return (
                  <div key={panelKey} className="px-1 text-center drop-shadow-[0_8px_24px_rgba(0,0,0,0.48)] sm:px-3">
                    {panel.kicker.text.trim() ? (
                      <p className={cn("text-center", getPanelLineClass("kicker", panel.kicker.color, panel.kicker.size))}>{panel.kicker.text}</p>
                    ) : null}
                    {panel.title.text.trim() ? (
                      <p className={cn("mt-3 text-center", getPanelLineClass("title", panel.title.color, panel.title.size))}>{panel.title.text}</p>
                    ) : null}
                    {panel.description.text.trim() ? (
                      <p className={cn("mt-3 text-center", getPanelLineClass("description", panel.description.color, panel.description.size))}>
                        {panel.description.text}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="public-home-hero-feature hidden lg:block lg:justify-self-end lg:text-right lg:drop-shadow-[0_8px_24px_rgba(0,0,0,0.48)]">
            <p className="display-kicker">{spotlightFilm ? spotlightLabel : "First Release"}</p>
            {spotlightFilm ? (
              <>
                <Link
                  href={`/film/${spotlightFilm.slug}`}
                  className="mt-6 block overflow-hidden rounded-[24px] border border-white/12 bg-black/30 shadow-[0_18px_42px_rgba(0,0,0,0.32)] transition hover:-translate-y-0.5"
                >
                  {spotlightArtworkUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={spotlightArtworkUrl}
                      alt={`${spotlightFilm.title} poster`}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[2/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[2/3] items-end bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01)),radial-gradient(circle_at_top,rgba(199,166,106,0.18),transparent_38%)] p-4 text-left">
                      <p className="text-xs uppercase tracking-[0.22em] text-foreground/70">Spotlight release</p>
                    </div>
                  )}
                </Link>
                <p className="mt-3 font-serif text-[1.55rem] font-semibold leading-tight text-foreground">
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
