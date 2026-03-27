"use client";

import { useEffect } from "react";

import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

type PublicIntroOverlayProps = {
  active: boolean;
  onComplete: () => void;
};

const INTRO_DURATION_MS = 5400;

export function PublicIntroOverlay({ active, onComplete }: PublicIntroOverlayProps) {
  const prefersReducedMotion = useReducedMotionSafe();

  useEffect(() => {
    if (!active || prefersReducedMotion) {
      return;
    }

    const timeout = window.setTimeout(() => {
      onComplete();
    }, INTRO_DURATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [active, onComplete, prefersReducedMotion]);

  if (!active || prefersReducedMotion) {
    return null;
  }

  return (
    <div className="public-intro-overlay" aria-hidden="true">
      <div className="public-intro-overlay__veil" />
      <div className="public-intro-overlay__stars" />
      <div className="public-intro-overlay__event-horizon" />
      <div className="public-intro-overlay__proscenium" />
      <div className="public-intro-overlay__spotlights">
        <span className="public-intro-overlay__spotlight public-intro-overlay__spotlight--left" />
        <span className="public-intro-overlay__spotlight public-intro-overlay__spotlight--center" />
        <span className="public-intro-overlay__spotlight public-intro-overlay__spotlight--right" />
      </div>
      <div className="public-intro-overlay__glow" />
      <div className="public-intro-overlay__mark">
        <p className="eyebrow text-primary/80">ArsGratia</p>
        <p className="mt-3 max-w-xs font-serif text-[1.9rem] font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:max-w-xl sm:text-[2.7rem]">
          Entering a premiere theatre in the cosmos.
        </p>
      </div>
    </div>
  );
}
