"use client";

import { useEffect, useRef, useState } from "react";

const HERO_LOOP_VERSION = "v2";
const HERO_LOOP_PRIMARY_VIDEO = `/hero-loop-chrome.mp4?${HERO_LOOP_VERSION}`;
const HERO_LOOP_FALLBACK_VIDEO = `/video/hero-loop-chrome.mp4?${HERO_LOOP_VERSION}`;
const HERO_LOOP_POSTER = "/video/hero-loop-poster.jpg";
const HERO_LOOP_FORWARD_DURATION_SECONDS = 7;
const HERO_LOOP_OVERLAP_BLEND_MS = 860;
const HERO_LOOP_OVERLAP_THRESHOLD_SECONDS = HERO_LOOP_FORWARD_DURATION_SECONDS - 1.15;

function resolveInitialLoopState() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.documentElement.dataset.publicLoopVisible === "true";
}

function getVideoRef(index: 0 | 1, first: React.RefObject<HTMLVideoElement | null>, second: React.RefObject<HTMLVideoElement | null>) {
  return index === 0 ? first : second;
}

export function HeroBackgroundVideo() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [loopVisible, setLoopVisible] = useState(resolveInitialLoopState);
  const [videoAReady, setVideoAReady] = useState(false);
  const [videoBReady, setVideoBReady] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(() => {
    if (typeof document === "undefined") {
      return true;
    }

    return document.visibilityState === "visible";
  });
  const [isInViewport, setIsInViewport] = useState(true);
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);
  const activeLayerRef = useRef<0 | 1>(0);
  const shouldPlayRef = useRef(false);
  const handoffFinishTimeoutRef = useRef<number | null>(null);
  const handoffInFlightRef = useRef(false);

  useEffect(() => {
    activeLayerRef.current = activeLayer;
  }, [activeLayer]);

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
  const hasReadyVideo = videoAReady || videoBReady;

  useEffect(() => {
    shouldPlayRef.current = shouldPlayLoop;
  }, [shouldPlayLoop]);

  useEffect(() => {
    const clearHandoff = () => {
      if (handoffFinishTimeoutRef.current !== null) {
        window.clearTimeout(handoffFinishTimeoutRef.current);
        handoffFinishTimeoutRef.current = null;
      }

      handoffInFlightRef.current = false;
      setIsCrossfading(false);
    };

    const activeVideo = getVideoRef(activeLayerRef.current, videoARef, videoBRef).current;
    const inactiveVideo = getVideoRef(activeLayerRef.current === 0 ? 1 : 0, videoARef, videoBRef).current;

    if (!activeVideo || !inactiveVideo) {
      return;
    }

    if (!shouldPlayLoop) {
      clearHandoff();
      activeVideo.pause();
      inactiveVideo.pause();
      inactiveVideo.currentTime = 0;
      return;
    }

    if (activeVideo.currentTime >= HERO_LOOP_FORWARD_DURATION_SECONDS) {
      activeVideo.currentTime = 0;
    }

    activeVideo.play().catch(() => undefined);

    if (handoffInFlightRef.current) {
      inactiveVideo.play().catch(() => undefined);
    }

    return () => {
      clearHandoff();
    };
  }, [activeLayer, shouldPlayLoop]);

  useEffect(() => {
    const clearHandoff = () => {
      if (handoffFinishTimeoutRef.current !== null) {
        window.clearTimeout(handoffFinishTimeoutRef.current);
        handoffFinishTimeoutRef.current = null;
      }

      handoffInFlightRef.current = false;
      setIsCrossfading(false);
    };

    const queueHandoff = () => {
      if (handoffInFlightRef.current || !shouldPlayRef.current) {
        return;
      }

      const currentIndex = activeLayerRef.current;
      const nextIndex: 0 | 1 = currentIndex === 0 ? 1 : 0;
      const currentVideo = getVideoRef(currentIndex, videoARef, videoBRef).current;
      const nextVideo = getVideoRef(nextIndex, videoARef, videoBRef).current;

      if (!currentVideo || !nextVideo) {
        return;
      }

      handoffInFlightRef.current = true;
      setIsCrossfading(true);
      nextVideo.currentTime = 0;
      nextVideo.play().catch(() => undefined);

      handoffFinishTimeoutRef.current = window.setTimeout(() => {
        currentVideo.pause();
        currentVideo.currentTime = 0;
        activeLayerRef.current = nextIndex;
        setActiveLayer(nextIndex);
        handoffInFlightRef.current = false;
        setIsCrossfading(false);
      }, HERO_LOOP_OVERLAP_BLEND_MS);
    };

    const attachListeners = (index: 0 | 1, element: HTMLVideoElement | null) => {
      if (!element) {
        return () => undefined;
      }

      const handleTimeUpdate = () => {
        if (index !== activeLayerRef.current || handoffInFlightRef.current) {
          return;
        }

        if (element.currentTime >= HERO_LOOP_OVERLAP_THRESHOLD_SECONDS) {
          queueHandoff();
        }
      };

      const handleEnded = () => {
        if (index === activeLayerRef.current) {
          queueHandoff();
        }
      };

      element.addEventListener("timeupdate", handleTimeUpdate);
      element.addEventListener("ended", handleEnded);

      return () => {
        element.removeEventListener("timeupdate", handleTimeUpdate);
        element.removeEventListener("ended", handleEnded);
      };
    };

    const detachA = attachListeners(0, videoARef.current);
    const detachB = attachListeners(1, videoBRef.current);

    return () => {
      detachA();
      detachB();
      clearHandoff();
    };
  }, [prefersReducedMotion]);

  const layerVisible = loopVisible || prefersReducedMotion;
  const videoBaseClass = "absolute inset-0 h-full w-full -translate-y-[14%] scale-[1.12] object-cover object-center transition-opacity duration-[720ms] ease-out sm:scale-[1.1] lg:scale-[1.08] xl:object-[24%_center]";
  const videoAClass = activeLayer === 0
    ? isCrossfading
      ? `${videoBaseClass} z-10 opacity-34`
      : `${videoBaseClass} z-10 opacity-58`
    : isCrossfading
      ? `${videoBaseClass} z-20 opacity-58`
      : `${videoBaseClass} z-0 opacity-0`;
  const videoBClass = activeLayer === 1
    ? isCrossfading
      ? `${videoBaseClass} z-10 opacity-34`
      : `${videoBaseClass} z-10 opacity-58`
    : isCrossfading
      ? `${videoBaseClass} z-20 opacity-58`
      : `${videoBaseClass} z-0 opacity-0`;

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className={`absolute inset-0 transition-opacity duration-[720ms] ease-out ${layerVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div
          className={`absolute inset-0 -translate-y-[14%] scale-[1.12] bg-cover bg-center bg-no-repeat transition-opacity duration-[560ms] ease-out sm:scale-[1.1] lg:scale-[1.08] xl:bg-[position:24%_center] ${hasReadyVideo && !prefersReducedMotion ? "opacity-10" : "opacity-64"}`}
          style={{ backgroundImage: `url(${HERO_LOOP_POSTER})` }}
        />
        {!prefersReducedMotion ? (
          <>
            <video
              ref={videoARef}
              className={videoAClass}
              autoPlay={false}
              muted
              playsInline
              preload="metadata"
              poster={HERO_LOOP_POSTER}
              disablePictureInPicture
              disableRemotePlayback
              onCanPlay={() => setVideoAReady(true)}
            >
              <source src={HERO_LOOP_PRIMARY_VIDEO} type="video/mp4" />
              <source src={HERO_LOOP_FALLBACK_VIDEO} type="video/mp4" />
            </video>
            <video
              ref={videoBRef}
              className={videoBClass}
              autoPlay={false}
              muted
              playsInline
              preload="metadata"
              poster={HERO_LOOP_POSTER}
              disablePictureInPicture
              disableRemotePlayback
              onCanPlay={() => setVideoBReady(true)}
            >
              <source src={HERO_LOOP_PRIMARY_VIDEO} type="video/mp4" />
              <source src={HERO_LOOP_FALLBACK_VIDEO} type="video/mp4" />
            </video>
          </>
        ) : null}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,6,0.82)_0%,rgba(3,3,6,0.34)_34%,rgba(3,3,6,0.68)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_14%,rgba(2,2,4,0.5)_100%)]" />
    </div>
  );
}
