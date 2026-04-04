"use client";

import { useEffect, useRef, useState } from "react";

import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { HOME_INTRO_VIDEO_SRC } from "@/lib/constants/site";

type PublicIntroOverlayProps = {
  phase: "intro" | "blend" | "ready";
  showIntroOverlay: boolean;
  onPlaybackStart?: () => void;
};

const INTRO_PLAYBACK_RATE = 0.5;

export function PublicIntroOverlay({ phase, showIntroOverlay, onPlaybackStart }: PublicIntroOverlayProps) {
  const prefersReducedMotion = useReducedMotionSafe();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playbackMarkedRef = useRef(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!showIntroOverlay) {
      setVideoReady(false);
      playbackMarkedRef.current = false;
    }
  }, [showIntroOverlay]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || prefersReducedMotion || !showIntroOverlay) {
      return;
    }

    video.playbackRate = INTRO_PLAYBACK_RATE;

    if (phase === "intro") {
      video.currentTime = 0;
      video.play().catch(() => undefined);
      return;
    }

    if (phase === "blend") {
      video.play().catch(() => undefined);
      return;
    }

    video.pause();
  }, [phase, prefersReducedMotion, showIntroOverlay]);

  if (prefersReducedMotion || !showIntroOverlay || (phase !== "intro" && phase !== "blend")) {
    return null;
  }

  const opacity = phase === "intro" ? 1 : 0;

  return (
    <div
      className="public-intro-overlay"
      aria-hidden="true"
      data-phase={phase}
      style={{ opacity, visibility: "visible" }}
    >
      <div className="public-intro-overlay__media">
        <div className="public-intro-overlay__fallback" />
        <video
          ref={videoRef}
          className={`public-intro-overlay__video ${videoReady ? "is-ready" : ""}`}
          muted
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onPlaying={() => {
            if (!playbackMarkedRef.current) {
              playbackMarkedRef.current = true;
              onPlaybackStart?.();
            }
          }}
        >
          <source src={HOME_INTRO_VIDEO_SRC} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
