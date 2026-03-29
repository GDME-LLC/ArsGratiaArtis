"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { CinematicBackground } from "@/components/public/cinematic-background";
import { PublicIntroOverlay } from "@/components/public/public-intro-overlay";

const PUBLIC_INTRO_STORAGE_KEY = "arsgratia-public-intro-seen-v4";
const PUBLIC_INTRO_SKIP_ONCE_KEY = "arsgratia-public-intro-skip-once-v1";
const PUBLIC_INTRO_ENABLED = true;

const entryConfig = {
  mobile: {
    introDurationMs: 4700,
    loopLeadInMs: 220,
    blendDurationMs: 1050,
    contentRevealDelayMs: 240,
    heroRevealDelayMs: 720,
  },
  desktop: {
    introDurationMs: 4700,
    loopLeadInMs: 300,
    blendDurationMs: 1050,
    contentRevealDelayMs: 300,
    heroRevealDelayMs: 720,
  },
} as const;

type PublicEntryPhase = "intro" | "blend" | "ready";
type ExperiencePlatform = "mobile" | "desktop";

function resolveInitialPhase() {
  if (typeof document === "undefined") {
    return "intro" as PublicEntryPhase;
  }

  const phase = document.documentElement.dataset.publicEntry;
  return phase === "intro" || phase === "blend" ? phase : "ready";
}

function resolveInitialPlatform() {
  if (typeof document === "undefined") {
    return "desktop" as ExperiencePlatform;
  }

  return document.documentElement.dataset.platform === "mobile" ? "mobile" : "desktop";
}

function resolveInitialBoolean(name: string, fallback: boolean) {
  if (typeof document === "undefined") {
    return fallback;
  }

  const value = document.documentElement.dataset[name];
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return fallback;
}

export function PublicExperienceRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [phase, setPhase] = useState<PublicEntryPhase>(resolveInitialPhase);
  const [platform, setPlatform] = useState<ExperiencePlatform>(resolveInitialPlatform);
  const [loopVisible, setLoopVisible] = useState(resolveInitialBoolean("publicLoopVisible", false));
  const [contentVisible, setContentVisible] = useState(resolveInitialBoolean("publicContentVisible", false));
  const [heroVisible, setHeroVisible] = useState(resolveInitialBoolean("publicHeroVisible", false));
  const config = useMemo(() => entryConfig[platform], [platform]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 820px), (pointer: coarse)");
    const updatePlatform = () => {
      const nextPlatform: ExperiencePlatform = mediaQuery.matches ? "mobile" : "desktop";
      document.documentElement.dataset.platform = nextPlatform;
      setPlatform(nextPlatform);
    };

    updatePlatform();
    mediaQuery.addEventListener("change", updatePlatform);

    return () => {
      mediaQuery.removeEventListener("change", updatePlatform);
    };
  }, []);

  useEffect(() => {
    if (!isHome || !PUBLIC_INTRO_ENABLED) {
      setPhase("ready");
      setLoopVisible(true);
      setContentVisible(true);
      setHeroVisible(true);
      document.documentElement.dataset.publicRoute = "false";
      document.documentElement.dataset.publicEntry = "ready";
      document.documentElement.dataset.publicLoopVisible = "true";
      document.documentElement.dataset.publicContentVisible = "true";
      document.documentElement.dataset.publicHeroVisible = "true";
      return;
    }

    document.documentElement.dataset.publicRoute = "true";

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const navigationEntries = typeof performance !== "undefined" && performance.getEntriesByType ? performance.getEntriesByType("navigation") : [];
    const navigationEntry = navigationEntries[0] as PerformanceNavigationTiming | undefined;
    const isReload = navigationEntry?.type === "reload";
    const skipIntroOnce = window.sessionStorage.getItem(PUBLIC_INTRO_SKIP_ONCE_KEY) === "true";
    if (skipIntroOnce) {
      window.sessionStorage.removeItem(PUBLIC_INTRO_SKIP_ONCE_KEY);
    }
    const introSeen = window.sessionStorage.getItem(PUBLIC_INTRO_STORAGE_KEY) === "true";
    const shouldPlayIntro = !prefersReducedMotion && !introSeen && !isReload && !skipIntroOnce;

    if (shouldPlayIntro) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    setPhase(shouldPlayIntro ? "intro" : "ready");
    setLoopVisible(!shouldPlayIntro);
    setContentVisible(!shouldPlayIntro);
    setHeroVisible(!shouldPlayIntro);
  }, [isHome, pathname]);

  useEffect(() => {
    document.documentElement.dataset.publicEntry = phase;
    document.documentElement.dataset.publicLoopVisible = loopVisible ? "true" : "false";
    document.documentElement.dataset.publicContentVisible = contentVisible ? "true" : "false";
    document.documentElement.dataset.publicHeroVisible = heroVisible ? "true" : "false";
  }, [contentVisible, heroVisible, loopVisible, phase]);

  useEffect(() => {
    if (!isHome || typeof window === "undefined") {
      return;
    }

    const markSkipIntroOnNextLoad = () => {
      window.sessionStorage.setItem(PUBLIC_INTRO_SKIP_ONCE_KEY, "true");
    };

    window.addEventListener("pagehide", markSkipIntroOnNextLoad);
    window.addEventListener("beforeunload", markSkipIntroOnNextLoad);

    return () => {
      window.removeEventListener("pagehide", markSkipIntroOnNextLoad);
      window.removeEventListener("beforeunload", markSkipIntroOnNextLoad);
    };
  }, [isHome]);

  useEffect(() => {
    if (!isHome || typeof window === "undefined") {
      return;
    }

    if (phase === "intro") {
      const prewarmLoop = window.setTimeout(() => {
        setLoopVisible(true);
      }, Math.max(config.introDurationMs - config.loopLeadInMs, 0));

      const toBlend = window.setTimeout(() => {
        setLoopVisible(true);
        setPhase("blend");
      }, config.introDurationMs);

      return () => {
        window.clearTimeout(prewarmLoop);
        window.clearTimeout(toBlend);
      };
    }

    if (phase === "blend") {
      const revealContent = window.setTimeout(() => {
        setContentVisible(true);
      }, config.contentRevealDelayMs);

      const revealHero = window.setTimeout(() => {
        setHeroVisible(true);
      }, config.heroRevealDelayMs);

      const finishBlend = window.setTimeout(() => {
        window.sessionStorage.setItem(PUBLIC_INTRO_STORAGE_KEY, "true");
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        setContentVisible(true);
        setHeroVisible(true);
        setLoopVisible(true);
        setPhase("ready");
      }, config.blendDurationMs);

      return () => {
        window.clearTimeout(revealContent);
        window.clearTimeout(revealHero);
        window.clearTimeout(finishBlend);
      };
    }
  }, [
    config.blendDurationMs,
    config.contentRevealDelayMs,
    config.heroRevealDelayMs,
    config.introDurationMs,
    config.loopLeadInMs,
    isHome,
    phase,
  ]);

  if (!isHome) {
    return <>{children}</>;
  }

  return (
    <div
      className="public-experience relative min-h-screen"
      data-public-variant="home"
      data-entry-state={phase}
      data-platform={platform}
      data-loop-visible={loopVisible ? "true" : "false"}
      data-content-visible={contentVisible ? "true" : "false"}
      data-hero-visible={heroVisible ? "true" : "false"}
    >
      <CinematicBackground variant="home" platform={platform} />
      <PublicIntroOverlay phase={phase} />
      <div
        className="public-experience__content relative z-10"
        style={{
          opacity: contentVisible ? 1 : 0,
          visibility: contentVisible ? "visible" : "hidden",
          pointerEvents: contentVisible ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
