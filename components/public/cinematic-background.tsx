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
  { className: "public-background__spotlight public-background__spotlight--left", duration: "68s", delay: "-12s" },
  { className: "public-background__spotlight public-background__spotlight--center", duration: "78s", delay: "-26s" },
  { className: "public-background__spotlight public-background__spotlight--right", duration: "88s", delay: "-18s" },
  { className: "public-background__spotlight public-background__spotlight--far-right", duration: "96s", delay: "-38s" },
];

export function CinematicBackground({ variant }: CinematicBackgroundProps) {
  const showStrongSpotlights = ENABLE_SKY_SPOTLIGHTS && (variant === "home" || variant === "theatre");
  const showMediumSpotlights = ENABLE_SKY_SPOTLIGHTS && variant === "film";
  const showSubtleSpotlights = ENABLE_SKY_SPOTLIGHTS && (variant === "creator" || variant === "editorial" || variant === "resource");

  return (
    <div className={`public-background ${variantClassMap[variant]}`} aria-hidden="true">
      <div className="public-background__base" />
      <div className="public-background__starfield" />
      <div className="public-background__nebula" />
      <div className="public-background__haze public-background__drift-slower" />
      <div className="public-background__light" />
      {(showStrongSpotlights || showMediumSpotlights || showSubtleSpotlights) ? (
        <div
          className={`public-background__spotlights ${showStrongSpotlights ? "is-strong" : showMediumSpotlights ? "is-medium" : "is-subtle"}`}
        >
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
        <div className="public-background__hero-video">
          <HeroBackgroundVideo />
        </div>
      ) : null}
      <div className="public-background__vignette" />
    </div>
  );
}
