"use client";

import { useEffect, useRef, useState } from "react";

const HERO_LOOP_PRIMARY_VIDEO = "/hero-loop.mp4";
const HERO_LOOP_FALLBACK_VIDEO = "/video/hero-loop.mp4";
const HERO_LOOP_POSTER = "/video/hero-loop-poster.jpg";

export function HeroBackgroundVideo() {
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !shouldAnimate) {
      return;
    }

    video.play().catch(() => undefined);
  }, [shouldAnimate]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 scale-[1.12] bg-cover bg-[center_42%] bg-no-repeat opacity-72 sm:scale-[1.1] lg:scale-[1.07]"
        style={{ backgroundImage: `url(${HERO_LOOP_POSTER})` }}
      />
      {shouldAnimate ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full scale-[1.12] object-cover object-[center_42%] opacity-38 sm:scale-[1.1] lg:scale-[1.07]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={HERO_LOOP_POSTER}
        >
          <source src={HERO_LOOP_PRIMARY_VIDEO} type="video/mp4" />
          <source src={HERO_LOOP_FALLBACK_VIDEO} type="video/mp4" />
        </video>
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,6,0.82)_0%,rgba(3,3,6,0.34)_30%,rgba(3,3,6,0.72)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_22%,rgba(2,2,4,0.64)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(199,166,106,0.18),transparent_34%)] mix-blend-screen opacity-70" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05),transparent_24%,transparent_66%,rgba(255,255,255,0.04))] opacity-36" />
    </div>
  );
}
