"use client";

import { useEffect, useState } from "react";

const HERO_LOOP_VIDEO = "/video/hero-loop.mp4";
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
        className="absolute inset-0 scale-[1.12] bg-cover bg-[center_42%] bg-no-repeat sm:scale-[1.1] lg:scale-[1.08]"
        style={{ backgroundImage: `url(${HERO_LOOP_POSTER})` }}
      />
      {shouldAnimate ? (
        <video
          className="absolute inset-0 h-full w-full scale-[1.12] object-cover object-[center_42%] sm:scale-[1.1] lg:scale-[1.08]"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HERO_LOOP_POSTER}
        >
          <source src={HERO_LOOP_VIDEO} type="video/mp4" />
        </video>
      ) : null}
      <div className="absolute inset-0 bg-black/52" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_28%,rgba(3,3,5,0.6)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,5,0.76)_0%,rgba(3,3,5,0.28)_32%,rgba(3,3,5,0.72)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(199,166,106,0.16),transparent_34%)] mix-blend-screen opacity-65" />
    </div>
  );
}

