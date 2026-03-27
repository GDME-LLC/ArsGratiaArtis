"use client";

import { useEffect, useRef, useState } from "react";

import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

type PublicIntroOverlayProps = {
  active: boolean;
  onComplete: () => void;
};

const INTRO_DURATION_MS = 7000;
const INTRO_ZOOM_SCALE = 1.1;
const INTRO_VIDEO_SRC = "/brand/intro-premiere.mp4";
const INTRO_FALLBACK_POSTER = "/video/hero-loop-poster.jpg";
const INTRO_PLAYBACK_RATE = 0.92;
const INTRO_WATERMARK_SRC = "/brand/arsgratia-icon-black.png";

export function PublicIntroOverlay({ active, onComplete }: PublicIntroOverlayProps) {
  const prefersReducedMotion = useReducedMotionSafe();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!active || prefersReducedMotion) {
      return;
    }

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.playbackRate = INTRO_PLAYBACK_RATE;
      video.play().catch(() => undefined);
    }

    const timeout = window.setTimeout(() => {
      onComplete();
    }, INTRO_DURATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [active, onComplete, prefersReducedMotion]);

  return (
    <div className="public-intro-overlay" aria-hidden="true" data-active={active ? "true" : "false"} style={{ ["--intro-zoom-scale" as string]: INTRO_ZOOM_SCALE }}>
      <div className="public-intro-overlay__veil" />
      <div className="public-intro-overlay__media">
        <div className="public-intro-overlay__fallback" style={{ backgroundImage: `url(${INTRO_FALLBACK_POSTER})` }} />
        <video
          ref={videoRef}
          className={`public-intro-overlay__video ${videoReady ? "is-ready" : ""}`}
          muted
          playsInline
          preload="auto"
          autoPlay={active}
          loop
          poster={INTRO_FALLBACK_POSTER}
          onCanPlay={() => setVideoReady(true)}
        >
          <source src={INTRO_VIDEO_SRC} type="video/mp4" />
        </video>
      </div>
      <div className="public-intro-overlay__stars" />
      <div className="public-intro-overlay__event-horizon" />
      <div className="public-intro-overlay__proscenium" />
      <div className="public-intro-overlay__spotlights">
        <span className="public-intro-overlay__spotlight public-intro-overlay__spotlight--left" />
        <span className="public-intro-overlay__spotlight public-intro-overlay__spotlight--center" />
        <span className="public-intro-overlay__spotlight public-intro-overlay__spotlight--right" />
      </div>
      <div className="public-intro-overlay__glow" />
      <div className="public-intro-overlay__watermark" style={{ backgroundImage: `url(${INTRO_WATERMARK_SRC})` }} />
    </div>
  );
}
