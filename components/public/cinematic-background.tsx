"use client";

import { HeroBackgroundVideo } from "@/components/marketing/hero-background-video";

export type PublicExperienceVariant = "home" | "creator" | "film" | "theatre" | "editorial" | "resource" | "default";

type CinematicBackgroundProps = {
  variant: PublicExperienceVariant;
};

const ENABLE_SKY_SPOTLIGHTS = true;

const variantClassMap: Record<PublicExperienceVariant, string> = {
  home: "is-home",
  creator: "is-creator",
  film: "is-film",
  theatre: "is-theatre",
  editorial: "is-editorial",
  resource: "is-resource",
  default: "is-default",
};

const spotlightConfigs = [
  { className: "public-background__spotlight public-background__spotlight--left", duration: "36s", delay: "-6s" },
  { className: "public-background__spotlight public-background__spotlight--center", duration: "42s", delay: "-14s" },
  { className: "public-background__spotlight public-background__spotlight--right", duration: "48s", delay: "-9s" },
  { className: "public-background__spotlight public-background__spotlight--far-right", duration: "54s", delay: "-20s" },
];

export function CinematicBackground({ variant }: CinematicBackgroundProps) {
  const canShowSpotlights = ENABLE_SKY_SPOTLIGHTS && (variant === "home" || variant === "film" || variant === "theatre");
  const canShowSubtleSpotlights = ENABLE_SKY_SPOTLIGHTS && (variant === "creator" || variant === "editorial" || variant === "resource");

  return (
    <div className={`public-background ${variantClassMap[variant]}`} aria-hidden="true">
      <div className="public-background__base" />
      <div className="public-background__starfield public-background__drift-slow" />
      <div className="public-background__starfield public-background__starfield--secondary public-background__drift-medium" />
      <div className="public-background__nebula public-background__parallax-far" />
      <div className="public-background__haze public-background__parallax-mid" />
      <div className="public-background__light public-background__drift-slower" />
      {(canShowSpotlights || canShowSubtleSpotlights) ? (
        <div className={`public-background__spotlights ${canShowSpotlights ? "is-strong" : "is-subtle"}`}>
          {spotlightConfigs.map((spotlight) => (
            <span
              key={spotlight.className}
              className={spotlight.className}
              style={{ animationDuration: spotlight.duration, animationDelay: spotlight.delay }}
            />
          ))}
        </div>
      ) : null}
      <div className="public-background__grain" />
      {variant === "home" ? (
        <div className="public-background__hero-video public-background__parallax-near">
          <HeroBackgroundVideo />
        </div>
      ) : null}
      <div className="public-background__vignette" />
    </div>
  );
}
