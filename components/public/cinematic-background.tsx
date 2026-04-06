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
      <video
        className="public-background__video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/video/space%20background.mov" type="video/mp4" />
        <source src="/video/space%20background.mov" type="video/quicktime" />
      </video>
      <div className="public-background__base" />
      <div className="public-background__vignette" />
    </div>
  );
}