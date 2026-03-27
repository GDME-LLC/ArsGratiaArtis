"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { CinematicBackground } from "@/components/public/cinematic-background";
import { PublicIntroOverlay } from "@/components/public/public-intro-overlay";

const PUBLIC_INTRO_STORAGE_KEY = "arsgratia-public-intro-seen";
const PUBLIC_INTRO_ENABLED = true;

type PublicEntryState = "playing" | "ready";
type ExperiencePlatform = "mobile" | "desktop";

function resolveInitialEntryState() {
  if (typeof document === "undefined") {
    return "ready" as PublicEntryState;
  }

  return document.documentElement.dataset.publicEntry === "playing" ? "playing" : "ready";
}

function resolveInitialPlatform() {
  if (typeof document === "undefined") {
    return "desktop" as ExperiencePlatform;
  }

  return document.documentElement.dataset.platform === "mobile" ? "mobile" : "desktop";
}

export function PublicExperienceRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [entryState, setEntryState] = useState<PublicEntryState>(resolveInitialEntryState);
  const [platform, setPlatform] = useState<ExperiencePlatform>(resolveInitialPlatform);
  const isHome = pathname === "/";

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
      document.documentElement.dataset.publicEntry = "ready";
      document.documentElement.dataset.publicRoute = "false";
      setEntryState("ready");
      return;
    }

    document.documentElement.dataset.publicRoute = "true";

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const introSeen = window.sessionStorage.getItem(PUBLIC_INTRO_STORAGE_KEY) === "true";
    const nextState: PublicEntryState = !prefersReducedMotion && !introSeen ? "playing" : "ready";

    document.documentElement.dataset.publicEntry = nextState;
    setEntryState(nextState);
  }, [isHome, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (entryState === "playing" && isHome) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [entryState, isHome]);

  if (!isHome) {
    return <>{children}</>;
  }

  return (
    <div className="public-experience relative min-h-screen" data-public-variant="home" data-intro-active={entryState === "playing" ? "true" : "false"} data-entry-state={entryState} data-platform={platform}>
      <CinematicBackground variant="home" platform={platform} />
      <PublicIntroOverlay
        active={entryState === "playing"}
        platform={platform}
        onComplete={() => {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(PUBLIC_INTRO_STORAGE_KEY, "true");
            document.documentElement.dataset.publicEntry = "ready";
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
          }
          setEntryState("ready");
        }}
      />
      <div className="public-experience__content relative z-10">{children}</div>
    </div>
  );
}
