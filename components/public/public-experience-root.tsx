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
type EntryMode = "intro" | "staged";

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
  const [entryMode, setEntryMode] = useState<EntryMode>("staged");
  const [platform, setPlatform] = useState<ExperiencePlatform>(resolveInitialPlatform);
  // Always mount the hero loop video first, never unmount it
  const [loopVisible, setLoopVisible] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
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
    // Always show the hero loop first, never unmount it
    setLoopVisible(true);
    if (!isHome || !PUBLIC_INTRO_ENABLED) {
      setPhase("ready");
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

    setEntryMode(shouldPlayIntro ? "intro" : "staged");
    setPhase(shouldPlayIntro ? "intro" : "blend");
    setLoopVisible(true); // Always true
    setContentVisible(false);
    setHeroVisible(false);
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

    // Always keep the hero loop visible and only reveal content after a fixed delay
    if (phase === "intro") {
      // Loop is already visible
      const toBlend = window.setTimeout(() => {
        setPhase("blend");
      }, config.introDurationMs);

      return () => {
        window.clearTimeout(toBlend);
      };
    }

    if (phase === "blend") {
      // Always use a fixed 1000ms delay for both content and hero reveal
      const revealContent = window.setTimeout(() => {
        setContentVisible(true);
      }, 1000);

      const revealHero = window.setTimeout(() => {
        setHeroVisible(true);
      }, 1000);

      const finishBlend = window.setTimeout(() => {
        window.sessionStorage.setItem(PUBLIC_INTRO_STORAGE_KEY, "true");
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        setContentVisible(true);
        setHeroVisible(true);
        setLoopVisible(true);
        setPhase("ready");
      }, 1000);

      return () => {
        window.clearTimeout(revealContent);
        window.clearTimeout(revealHero);
        window.clearTimeout(finishBlend);
      };
    }
  }, [
    config.introDurationMs,
    entryMode,
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
