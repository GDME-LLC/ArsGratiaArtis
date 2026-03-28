"use client";

import { useEffect, useRef, useState } from "react";

import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

type PublicIntroOverlayProps = {
  phase: "intro" | "blend" | "ready";
};

const INTRO_OPENING_VIDEO_SRC = "/brand/firefly-opening.mp4";
const INTRO_PLAYBACK_RATE = 0.5;

export function PublicIntroOverlay({ phase }: PublicIntroOverlayProps) {
  const prefersReducedMotion = useReducedMotionSafe();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (phase === "intro") {
      video.currentTime = 0;
      video.playbackRate = INTRO_PLAYBACK_RATE;
      video.play().catch(() => undefined);
      return;
    }

    if (phase === "blend") {
      video.playbackRate = INTRO_PLAYBACK_RATE;
      video.play().catch(() => undefined);
      return;
    }

    video.pause();
  }, [phase]);

  if (prefersReducedMotion) {
    return null;
  }

  const visible = phase === "intro" || phase === "blend";
  const opacity = phase === "intro" ? 1 : phase === "blend" ? 0 : 0;

  return (
    <div
      className="public-intro-overlay"
      aria-hidden="true"
      data-phase={phase}
      style={{ opacity, visibility: visible ? "visible" : "hidden" }}
    >
      <div className="public-intro-overlay__media">
        <div className="public-intro-overlay__fallback" />
        <video
          ref={videoRef}
          className={`public-intro-overlay__video ${videoReady ? "is-ready" : ""}`}
          muted
          playsInline
          preload="auto"
          autoPlay={visible}
          loop
          onCanPlay={() => setVideoReady(true)}
        >
          <source src={INTRO_OPENING_VIDEO_SRC} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
