"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { CinematicBackground } from "@/components/public/cinematic-background";
import { PublicIntroOverlay } from "@/components/public/public-intro-overlay";

const PUBLIC_INTRO_STORAGE_KEY = "arsgratia-public-intro-seen-v4";
const PUBLIC_INTRO_ENABLED = true;

const entryConfig = {
  mobile: {
    introDurationMs: 5000,
    blendDurationMs: 1400,
    contentRevealDelayMs: 980,
  },
  desktop: {
    introDurationMs: 5000,
    blendDurationMs: 1400,
    contentRevealDelayMs: 980,
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
      document.documentElement.dataset.publicRoute = "false";
      document.documentElement.dataset.publicEntry = "ready";
      document.documentElement.dataset.publicLoopVisible = "true";
      document.documentElement.dataset.publicContentVisible = "true";
      return;
    }

    document.documentElement.dataset.publicRoute = "true";

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const introSeen = window.sessionStorage.getItem(PUBLIC_INTRO_STORAGE_KEY) === "true";
    const shouldPlayIntro = !prefersReducedMotion && !introSeen;

    if (shouldPlayIntro) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    setPhase(shouldPlayIntro ? "intro" : "ready");
    setLoopVisible(!shouldPlayIntro);
    setContentVisible(!shouldPlayIntro);
  }, [isHome, pathname]);

  useEffect(() => {
    document.documentElement.dataset.publicEntry = phase;
    document.documentElement.dataset.publicLoopVisible = loopVisible ? "true" : "false";
    document.documentElement.dataset.publicContentVisible = contentVisible ? "true" : "false";
  }, [contentVisible, loopVisible, phase]);

  useEffect(() => {
    if (!isHome || typeof window === "undefined") {
      return;
    }

    if (phase === "intro") {
      const toBlend = window.setTimeout(() => {
        setLoopVisible(true);
        setPhase("blend");
      }, config.introDurationMs);

      return () => {
        window.clearTimeout(toBlend);
      };
    }

    if (phase === "blend") {
      const revealContent = window.setTimeout(() => {
        setContentVisible(true);
      }, config.contentRevealDelayMs);

      const finishBlend = window.setTimeout(() => {
        window.sessionStorage.setItem(PUBLIC_INTRO_STORAGE_KEY, "true");
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        setContentVisible(true);
        setLoopVisible(true);
        setPhase("ready");
      }, config.blendDurationMs);

      return () => {
        window.clearTimeout(revealContent);
        window.clearTimeout(finishBlend);
      };
    }
  }, [config.blendDurationMs, config.contentRevealDelayMs, config.introDurationMs, isHome, phase]);

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
