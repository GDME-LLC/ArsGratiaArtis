"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { CinematicBackground, type PublicExperienceVariant } from "@/components/public/cinematic-background";
import { PublicIntroOverlay } from "@/components/public/public-intro-overlay";

const PUBLIC_STATIC_ROUTES = new Set([
  "/",
  "/feed",
  "/filmmakers",
  "/beyond-cinema",
  "/manifesto",
  "/resources",
  "/report",
  "/privacy",
  "/terms",
]);

const PUBLIC_INTRO_STORAGE_KEY = "arsgratia-public-intro-seen";
const PUBLIC_INTRO_ENABLED = true;
const MAX_REVEAL_STAGGER_MS = 40;

type PublicEntryState = "playing" | "ready";

function isPublicRoute(pathname: string) {
  if (PUBLIC_STATIC_ROUTES.has(pathname)) {
    return true;
  }

  return pathname.startsWith("/creator/") || pathname.startsWith("/film/") || pathname.startsWith("/series/") || pathname.startsWith("/resources/");
}

function resolveVariant(pathname: string): PublicExperienceVariant {
  if (pathname === "/") {
    return "home";
  }

  if (pathname.startsWith("/film/")) {
    return "film";
  }

  if (pathname.startsWith("/series/") || pathname === "/beyond-cinema") {
    return "theatre";
  }

  if (pathname.startsWith("/creator/") || pathname === "/filmmakers") {
    return "creator";
  }

  if (pathname === "/manifesto" || pathname === "/privacy" || pathname === "/terms") {
    return "editorial";
  }

  if (pathname === "/resources" || pathname.startsWith("/resources/")) {
    return "resource";
  }

  return "default";
}

function resolveInitialEntryState() {
  if (typeof document === "undefined") {
    return "ready" as PublicEntryState;
  }

  return document.documentElement.dataset.publicEntry === "playing" ? "playing" : "ready";
}

export function PublicExperienceRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [entryState, setEntryState] = useState<PublicEntryState>(resolveInitialEntryState);
  const isPublic = isPublicRoute(pathname);
  const variant = useMemo(() => resolveVariant(pathname), [pathname]);

  useEffect(() => {
    if (!isPublic || !PUBLIC_INTRO_ENABLED) {
      document.documentElement.dataset.publicEntry = "ready";
      setEntryState("ready");
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const introSeen = window.sessionStorage.getItem(PUBLIC_INTRO_STORAGE_KEY) === "true";
    const nextState: PublicEntryState = !prefersReducedMotion && !introSeen ? "playing" : "ready";

    document.documentElement.dataset.publicEntry = nextState;
    setEntryState(nextState);
  }, [isPublic, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (entryState === "playing" && pathname === "/") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [entryState, pathname]);

  useEffect(() => {
    if (!isPublic || typeof window === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -12% 0px",
      },
    );

    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    nodes.forEach((node, index) => {
      node.style.setProperty("--reveal-delay", `${Math.min(index % 2, 1) * MAX_REVEAL_STAGGER_MS}ms`);
      observer.observe(node);
    });

    return () => {
      observer.disconnect();
    };
  }, [isPublic, pathname]);

  if (!isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="public-experience relative min-h-screen" data-public-variant={variant} data-intro-active={entryState === "playing" ? "true" : "false"} data-entry-state={entryState}>
      <CinematicBackground variant={variant} />
      <PublicIntroOverlay
        active={entryState === "playing"}
        onComplete={() => {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(PUBLIC_INTRO_STORAGE_KEY, "true");
            document.documentElement.dataset.publicEntry = "ready";
            if (pathname === "/") {
              window.scrollTo({ top: 0, left: 0, behavior: "auto" });
            }
          }
          setEntryState("ready");
        }}
      />
      <div className="public-experience__content relative z-10">{children}</div>
    </div>
  );
}
