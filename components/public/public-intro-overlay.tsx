"use client";

import { useEffect, useMemo } from "react";

import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

type PublicIntroOverlayProps = {
  active: boolean;
  platform: "mobile" | "desktop";
  onComplete: () => void;
};

const introConfig = {
  mobile: {
    durationMs: 7200,
  },
  desktop: {
    durationMs: 9000,
  },
} as const;

export function PublicIntroOverlay({ active, platform, onComplete }: PublicIntroOverlayProps) {
  const prefersReducedMotion = useReducedMotionSafe();
  const config = useMemo(() => introConfig[platform], [platform]);

  useEffect(() => {
    if (!active || prefersReducedMotion) {
      return;
    }

    const timeout = window.setTimeout(() => {
      onComplete();
    }, config.durationMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [active, config.durationMs, onComplete, prefersReducedMotion]);

  return (
    <div className="public-intro-overlay" aria-hidden="true" data-active={active ? "true" : "false"} data-platform={platform}>
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
    </div>
  );
}
