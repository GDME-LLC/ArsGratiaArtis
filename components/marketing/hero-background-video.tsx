"use client";

import { useEffect, useState } from "react";

const HERO_LOOP_PRIMARY_VIDEO = "/hero-loop.mp4";
const HERO_LOOP_FALLBACK_VIDEO = "/video/hero-loop.mp4";
const HERO_LOOP_POSTER = "/video/hero-loop-poster.jpg";

export function HeroBackgroundVideo() {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      setShouldAnimate(!mediaQuery.matches);
    };

    update();
    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 scale-[1.08] bg-cover bg-[center_42%] bg-no-repeat opacity-42 sm:scale-[1.06]"
        style={{ backgroundImage: `url(${HERO_LOOP_POSTER})` }}
      />
      {shouldAnimate ? (
        <video
          className="absolute inset-0 h-full w-full scale-[1.08] object-cover object-[center_42%] opacity-[0.16] sm:scale-[1.06]"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HERO_LOOP_POSTER}
        >
          <source src={HERO_LOOP_PRIMARY_VIDEO} type="video/mp4" />
          <source src={HERO_LOOP_FALLBACK_VIDEO} type="video/mp4" />
        </video>
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,8,0.92)_0%,rgba(4,4,8,0.72)_34%,rgba(4,4,8,0.88)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,2,4,0.82)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(255,255,255,0.02),transparent_22%,transparent_78%,rgba(255,255,255,0.02))] opacity-30" />
    </div>
  );
}
