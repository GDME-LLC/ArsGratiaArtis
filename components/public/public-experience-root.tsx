"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { CinematicBackground } from "@/components/public/cinematic-background";
import { PublicIntroOverlay } from "@/components/public/public-intro-overlay";
import { PUBLIC_HOME_VISITED_STORAGE_KEY, PUBLIC_INTRO_STORAGE_KEY } from "@/lib/constants/site";

const PUBLIC_INTRO_ENABLED = true;

const entryConfig = {
  mobile: {
    introDurationMs: 4700,
    blendDurationMs: 1050,
    contentRevealDelayMs: 240,
    heroRevealDelayMs: 720,
  },
  desktop: {
    introDurationMs: 4700,
    blendDurationMs: 1050,
    contentRevealDelayMs: 300,
    heroRevealDelayMs: 720,
  },
} as const;

type PublicEntryPhase = "intro" | "blend" | "ready";
type ExperiencePlatform = "mobile" | "desktop";

type HomeEntryState = {
  phase: PublicEntryPhase;
  contentVisible: boolean;
  heroVisible: boolean;
  showIntroOverlay: boolean;
};

const READY_STATE: HomeEntryState = {
  phase: "ready",
  contentVisible: true,
  heroVisible: true,
  showIntroOverlay: false,
};

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

function resolveInitialHomeEntryState(): HomeEntryState {
  if (typeof document === "undefined") {
    return READY_STATE;
  }

  const phase = document.documentElement.dataset.publicEntry;
  const nextPhase: PublicEntryPhase = phase === "intro" || phase === "blend" ? phase : "ready";

  return {
    phase: nextPhase,
    contentVisible: resolveInitialBoolean("publicContentVisible", nextPhase === "ready"),
    heroVisible: resolveInitialBoolean("publicHeroVisible", nextPhase === "ready"),
    showIntroOverlay: resolveInitialBoolean("publicShowIntroOverlay", nextPhase !== "ready"),
  };
}

function syncDocumentEntryState(isHome: boolean, state: HomeEntryState) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.publicRoute = isHome ? "true" : "false";
  root.dataset.publicEntry = state.phase;
  root.dataset.publicLoopVisible = "true";
  root.dataset.publicContentVisible = state.contentVisible ? "true" : "false";
  root.dataset.publicHeroVisible = state.heroVisible ? "true" : "false";
  root.dataset.publicShowIntroOverlay = state.showIntroOverlay ? "true" : "false";
}

function computeShouldPlayIntro() {
  if (typeof window === "undefined") {
    return false;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const navigationEntries = typeof performance !== "undefined" && performance.getEntriesByType
    ? performance.getEntriesByType("navigation")
    : [];
  const navigationEntry = navigationEntries[0] as PerformanceNavigationTiming | undefined;
  const isReload = navigationEntry?.type === "reload";
  const introSeen = window.sessionStorage.getItem(PUBLIC_INTRO_STORAGE_KEY) === "true";
  const homeVisited = window.sessionStorage.getItem(PUBLIC_HOME_VISITED_STORAGE_KEY) === "true";

  return !prefersReducedMotion && !introSeen && !isReload && !homeVisited;
}

export function PublicExperienceRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [platform, setPlatform] = useState<ExperiencePlatform>(resolveInitialPlatform);
  const [entryState, setEntryState] = useState<HomeEntryState>(resolveInitialHomeEntryState);
  const config = useMemo(() => entryConfig[platform], [platform]);
  const introMarkedRef = useRef(false);

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

  useLayoutEffect(() => {
    if (!isHome || !PUBLIC_INTRO_ENABLED) {
      introMarkedRef.current = false;
      setEntryState(READY_STATE);
      syncDocumentEntryState(false, READY_STATE);
      return;
    }

    const shouldPlayIntro = computeShouldPlayIntro();
    const nextState = shouldPlayIntro
      ? {
          phase: "intro" as const,
          contentVisible: false,
          heroVisible: false,
          showIntroOverlay: true,
        }
      : READY_STATE;

    introMarkedRef.current = false;
    if (!shouldPlayIntro) {
      window.sessionStorage.setItem(PUBLIC_HOME_VISITED_STORAGE_KEY, "true");
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    setEntryState(nextState);
    syncDocumentEntryState(true, nextState);
  }, [isHome, pathname]);

  useEffect(() => {
    syncDocumentEntryState(isHome, entryState);
  }, [entryState, isHome]);

  useEffect(() => {
    if (!isHome || typeof window === "undefined") {
      return;
    }

    if (entryState.phase === "intro") {
      const toBlend = window.setTimeout(() => {
        setEntryState((current) =>
          current.phase === "intro"
            ? {
                ...current,
                phase: "blend",
                showIntroOverlay: true,
              }
            : current,
        );
      }, config.introDurationMs);

      return () => {
        window.clearTimeout(toBlend);
      };
    }

    if (entryState.phase === "blend") {
      const revealContent = window.setTimeout(() => {
        setEntryState((current) =>
          current.phase === "blend"
            ? {
                ...current,
                contentVisible: true,
              }
            : current,
        );
      }, config.contentRevealDelayMs);

      const revealHero = window.setTimeout(() => {
        setEntryState((current) =>
          current.phase === "blend"
            ? {
                ...current,
                heroVisible: true,
              }
            : current,
        );
      }, config.heroRevealDelayMs);

      const finishBlend = window.setTimeout(() => {
        if (!introMarkedRef.current) {
          window.sessionStorage.setItem(PUBLIC_INTRO_STORAGE_KEY, "true");
          window.sessionStorage.setItem(PUBLIC_HOME_VISITED_STORAGE_KEY, "true");
          introMarkedRef.current = true;
        }

        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        setEntryState(READY_STATE);
      }, config.blendDurationMs);

      return () => {
        window.clearTimeout(revealContent);
        window.clearTimeout(revealHero);
        window.clearTimeout(finishBlend);
      };
    }
  }, [config.blendDurationMs, config.contentRevealDelayMs, config.heroRevealDelayMs, config.introDurationMs, entryState.phase, isHome]);

  const handleIntroPlaybackStart = () => {
    if (typeof window === "undefined" || introMarkedRef.current) {
      return;
    }

    window.sessionStorage.setItem(PUBLIC_INTRO_STORAGE_KEY, "true");
    window.sessionStorage.setItem(PUBLIC_HOME_VISITED_STORAGE_KEY, "true");
    introMarkedRef.current = true;
  };

  if (!isHome) {
    return <>{children}</>;
  }

  return (
    <div
      className="public-experience relative min-h-screen"
      data-public-variant="home"
      data-entry-state={entryState.phase}
      data-platform={platform}
      data-loop-visible="true"
      data-content-visible={entryState.contentVisible ? "true" : "false"}
      data-hero-visible={entryState.heroVisible ? "true" : "false"}
    >
      <CinematicBackground variant="home" platform={platform} />
      <PublicIntroOverlay
        phase={entryState.phase}
        showIntroOverlay={entryState.showIntroOverlay}
        onPlaybackStart={handleIntroPlaybackStart}
      />
      <div
        className="public-experience__content relative z-10"
        style={{
          opacity: entryState.contentVisible ? 1 : 0,
          visibility: entryState.contentVisible ? "visible" : "hidden",
          pointerEvents: entryState.contentVisible ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
