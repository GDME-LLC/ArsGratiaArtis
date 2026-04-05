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

type HeroProductPanelsProps = {
  heroContent: HeroContentSettings;
  className?: string;
  softBackdrop?: boolean;
};

const toneClassMap: Record<HeroCopyColor, string> = {
  gold: "text-primary/94",
  ivory: "text-foreground",
  soft: "text-foreground/96",
  muted: "text-foreground/84",
  rose: "text-accent/96",
  slate: "text-foreground/86",
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
    <section className="relative -mt-[3.85rem] w-full pt-[4.05rem] sm:-mt-[4.2rem] sm:pt-[4.45rem]">
      <div className="relative min-h-[108vh] overflow-hidden py-6 sm:py-7 lg:py-8">
        <HeroBackgroundVideo />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-28 bg-[linear-gradient(180deg,rgba(6,8,12,0)_0%,rgba(6,8,12,0.86)_100%)] sm:h-36" />
        <div className="relative z-10 grid gap-8 px-5 sm:px-7 lg:-translate-y-14 lg:grid-cols-[minmax(0,1fr)_15.5rem] lg:items-end lg:px-10 xl:px-14">
          <div className="max-w-3xl">
            <div className="public-home-hero-copy px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
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

            <div className="public-home-hero-actions mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <Button
                  asChild
                  size="xl"
                  className="w-full normal-case tracking-[0.04em] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.12))] text-black shadow-[0_14px_34px_rgba(0,0,0,0.54),inset_0_1px_0_rgba(255,255,255,0.64),inset_0_-1px_0_rgba(132,140,152,0.42)] backdrop-blur-[8px] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.16))] sm:w-auto"
                >
                  <Link href="/feed">Browse Filmwork</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="w-full border-white/24 bg-black/28 text-foreground/88 hover:text-foreground sm:w-auto">
                  <Link href="/filmmakers">Creators</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="w-full border-white/24 bg-black/28 text-foreground/88 hover:text-foreground sm:w-auto">
                  <Link href="/workflow-tool">Start a Project</Link>
                </Button>
              </div>
            </div>
            </div>

            <HeroProductPanels heroContent={heroContent} softBackdrop className="mt-14 hidden sm:block sm:mt-16" />
            <div aria-hidden="true" className="mt-14 h-[10.5rem] sm:hidden" />
          </div>

          
          <div className="public-home-hero-feature hidden border border-white/30 bg-black p-3 shadow-[0_14px_34px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.34),inset_0_-1px_0_rgba(116,124,136,0.34)] lg:block lg:w-[14.75rem] lg:self-start lg:translate-y-10 lg:justify-self-end lg:text-right lg:drop-shadow-[0_8px_24px_rgba(0,0,0,0.48)] xl:translate-y-8">
            <p className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(214,222,233,0.88)_52%,rgba(166,176,190,0.84))] bg-clip-text font-sans text-[0.82rem] font-semibold uppercase tracking-[0.3em] text-transparent drop-shadow-[0_2px_12px_rgba(255,255,255,0.34)] sm:text-[0.88rem] sm:tracking-[0.34em]">{spotlightFilm ? spotlightLabel : "First Release"}</p>
            {spotlightFilm ? (
              <>
                <Link
                  href={`/film/${spotlightFilm.slug}`}
                  className="mt-3 block overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.34)] transition hover:-translate-y-0.5"
                >
                  {spotlightArtworkUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={spotlightArtworkUrl}
                      alt={`${spotlightFilm.title} poster`}
                      loading="lazy"
                      decoding="async"
                      className="h-[min(38vh,16.5rem)] w-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-[min(38vh,16.5rem)] items-end bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01)),radial-gradient(circle_at_top,rgba(229,236,245,0.14),transparent_38%)] p-3 text-left">
                      <p className="text-xs uppercase tracking-[0.22em] text-foreground/70">Spotlight release</p>
                    </div>
                  )}
                </Link>
                <div className="mt-2.5 border border-white/24 bg-black px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                  <p className="font-serif text-[1.1rem] font-semibold leading-tight text-foreground">{spotlightFilm.title}</p>
                  <p className="mt-1.5 text-xs uppercase tracking-[0.18em] text-foreground/72">by {spotlightCreatorName}</p>
                  <p className="mt-2 line-clamp-1 text-[0.8rem] leading-5 text-foreground/74">
                    {spotlightFilm.synopsis || "A newly published film on ArsGratia."}
                  </p>
                  <Button asChild size="default" variant="ghost" className="mt-2 w-full justify-center">
                    <Link href={`/film/${spotlightFilm.slug}`}>Watch film</Link>
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-2 font-serif text-[1.3rem] font-semibold leading-tight text-foreground">
                The first public films published on ArsGratia will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HeroProductPanels({ heroContent, className, softBackdrop = false }: HeroProductPanelsProps) {
  return (
    <div
      className={cn(
        softBackdrop
          ? "public-home-hero-panels relative p-5 sm:p-6 lg:p-7"
          : "public-home-hero-panels relative rounded-[26px] border border-white/14 bg-black/46 p-5 backdrop-blur-[14px] shadow-[0_16px_40px_rgba(0,0,0,0.46)] sm:p-6 lg:p-7",
        className,
      )}
    >
      {softBackdrop ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[-1.5rem] inset-y-[-0.45rem] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.18),transparent_60%),linear-gradient(180deg,rgba(6,8,14,0.66),rgba(3,5,10,0.84))] blur-3xl"
        />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[26px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_52%),linear-gradient(180deg,rgba(14,16,24,0.3),rgba(6,7,12,0.56))]"
        />
      )}
      <div className="relative grid gap-5 sm:grid-cols-3 sm:gap-6">
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
  );
}
