"use client";

export type PublicExperienceVariant = "home" | "creator" | "film" | "theatre" | "editorial" | "resource" | "default";

type CinematicBackgroundProps = {
  variant: PublicExperienceVariant;
  platform?: "mobile" | "desktop";
};

const variantClassMap: Record<PublicExperienceVariant, string> = {
  home: "is-home",
  creator: "is-creator",
  film: "is-film",
  theatre: "is-theatre",
  editorial: "is-editorial",
  resource: "is-resource",
  default: "is-default",
};

export function CinematicBackground({ variant, platform = "desktop" }: CinematicBackgroundProps) {
  return (
    <div className={`public-background ${variantClassMap[variant]}`} aria-hidden="true" data-platform={platform}>
      <div className="public-background__base" />
      <div className="public-background__starfield" />
      <div className="public-background__nebula" />
      <div className="public-background__haze public-background__drift-slower" />
      <div className="public-background__light" />
      <div className="public-background__grain" />
      <div className="public-background__vignette" />
    </div>
  );
}