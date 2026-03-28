"use client";

import { useEffect, useRef, useState } from "react";

const HERO_LOOP_PRIMARY_VIDEO = "/hero-loop.mp4";
const HERO_LOOP_FALLBACK_VIDEO = "/video/hero-loop.mp4";
const HERO_LOOP_POSTER = "/video/hero-loop-poster.jpg";
const HERO_LOOP_FORWARD_DURATION_SECONDS = 7;
const HERO_LOOP_RESTART_BLEND_MS = 440;
const HERO_LOOP_RESTART_THRESHOLD_SECONDS = HERO_LOOP_FORWARD_DURATION_SECONDS - 0.65;

function resolveInitialLoopState() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.documentElement.dataset.publicLoopVisible === "true";
}

export function HeroBackgroundVideo() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [loopVisible, setLoopVisible] = useState(resolveInitialLoopState);
  const [videoReady, setVideoReady] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(() => {
    if (typeof document === "undefined") {
      return true;
    }

    return document.visibilityState === "visible";
  });
  const [isInViewport, setIsInViewport] = useState(true);
  const [isRestartBlending, setIsRestartBlending] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shouldPlayRef = useRef(false);
  const restartResetTimeoutRef = useRef<number | null>(null);
  const restartFinishTimeoutRef = useRef<number | null>(null);
  const restartInFlightRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMotion = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    const updateLoopVisibility = () => {
      setLoopVisible(resolveInitialLoopState());
    };

    const updatePageVisibility = () => {
      setIsPageVisible(document.visibilityState === "visible");
    };

    updateMotion();
    updateLoopVisibility();
    updatePageVisibility();

    mediaQuery.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updatePageVisibility);

    const observer = new MutationObserver(updateLoopVisibility);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-public-loop-visible"],
    });

    return () => {
      mediaQuery.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updatePageVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      {
        rootMargin: "160px 0px",
      },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  const shouldPlayLoop = loopVisible && isInViewport && isPageVisible && !prefersReducedMotion;

  useEffect(() => {
    shouldPlayRef.current = shouldPlayLoop;
  }, [shouldPlayLoop]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (!shouldPlayLoop) {
      if (restartResetTimeoutRef.current !== null) {
        window.clearTimeout(restartResetTimeoutRef.current);
        restartResetTimeoutRef.current = null;
      }

      if (restartFinishTimeoutRef.current !== null) {
        window.clearTimeout(restartFinishTimeoutRef.current);
        restartFinishTimeoutRef.current = null;
      }

      restartInFlightRef.current = false;
      setIsRestartBlending(false);
      video.pause();
      return;
    }

    if (video.currentTime >= HERO_LOOP_FORWARD_DURATION_SECONDS) {
      video.currentTime = 0;
    }

    video.play().catch(() => undefined);
  }, [shouldPlayLoop]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || prefersReducedMotion) {
      return;
    }

    const clearRestartBlend = () => {
      if (restartResetTimeoutRef.current !== null) {
        window.clearTimeout(restartResetTimeoutRef.current);
        restartResetTimeoutRef.current = null;
      }

      if (restartFinishTimeoutRef.current !== null) {
        window.clearTimeout(restartFinishTimeoutRef.current);
        restartFinishTimeoutRef.current = null;
      }

      restartInFlightRef.current = false;
      setIsRestartBlending(false);
    };

    const queueRestartBlend = () => {
      if (restartInFlightRef.current || !shouldPlayRef.current) {
        return;
      }

      restartInFlightRef.current = true;
      setIsRestartBlending(true);

      restartResetTimeoutRef.current = window.setTimeout(() => {
        const currentVideo = videoRef.current;

        if (!currentVideo) {
          return;
        }

        currentVideo.currentTime = 0;

        if (shouldPlayRef.current) {
          currentVideo.play().catch(() => undefined);
        }
      }, Math.round(HERO_LOOP_RESTART_BLEND_MS * 0.5));

      restartFinishTimeoutRef.current = window.setTimeout(() => {
        restartInFlightRef.current = false;
        setIsRestartBlending(false);
      }, HERO_LOOP_RESTART_BLEND_MS);
    };

    const handleTimeUpdate = () => {
      if (video.currentTime >= HERO_LOOP_RESTART_THRESHOLD_SECONDS) {
        queueRestartBlend();
      }
    };

    const handleEnded = () => {
      queueRestartBlend();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      clearRestartBlend();
    };
  }, [prefersReducedMotion]);

  const layerVisible = loopVisible || prefersReducedMotion;

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className={`absolute inset-0 transition-opacity duration-[720ms] ease-out ${layerVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div
          className={`absolute inset-0 scale-[1.12] bg-cover bg-[center_42%] bg-no-repeat transition-opacity duration-[560ms] ease-out sm:scale-[1.1] lg:scale-[1.08] ${videoReady && !prefersReducedMotion ? (isRestartBlending ? "opacity-30" : "opacity-10") : "opacity-64"}`}
          style={{ backgroundImage: `url(${HERO_LOOP_POSTER})` }}
        />
        {!prefersReducedMotion ? (
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full scale-[1.12] object-cover object-[center_42%] transition-opacity duration-[720ms] ease-out sm:scale-[1.1] lg:scale-[1.08] ${loopVisible ? (isRestartBlending ? "opacity-40" : "opacity-58") : "opacity-0"}`}
            autoPlay={false}
            muted
            playsInline
            preload="metadata"
            poster={HERO_LOOP_POSTER}
            disablePictureInPicture
            disableRemotePlayback
            onCanPlay={() => setVideoReady(true)}
          >
            <source src={HERO_LOOP_PRIMARY_VIDEO} type="video/mp4" />
            <source src={HERO_LOOP_FALLBACK_VIDEO} type="video/mp4" />
          </video>
        ) : null}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,6,0.78)_0%,rgba(3,3,6,0.24)_34%,rgba(3,3,6,0.62)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_16%,rgba(2,2,4,0.46)_100%)]" />
    </div>
  );
}
