"use client";

import { useEffect, useRef, useState } from "react";

const HERO_LOOP_PRIMARY_VIDEO = "/hero-loop.mp4";
const HERO_LOOP_FALLBACK_VIDEO = "/video/hero-loop.mp4";
const HERO_LOOP_POSTER = "/video/hero-loop-poster.jpg";
const HERO_LOOP_FORWARD_DURATION_SECONDS = 7;
const HERO_LOOP_MOBILE_BLEND_MS = 860;
const HERO_LOOP_DESKTOP_BLEND_MS = 520;
const HERO_LOOP_MOBILE_OVERLAP_THRESHOLD_SECONDS = HERO_LOOP_FORWARD_DURATION_SECONDS - 1.15;
const HERO_LOOP_DESKTOP_OVERLAP_THRESHOLD_SECONDS = HERO_LOOP_FORWARD_DURATION_SECONDS - 0.72;

function resolveInitialLoopState() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.documentElement.dataset.publicLoopVisible === "true";
}

function resolveInitialDesktopPlatform() {
  if (typeof document === "undefined") {
    return true;
  }

  return document.documentElement.dataset.platform !== "mobile";
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
  const [isDesktopPlatform, setIsDesktopPlatform] = useState(resolveInitialDesktopPlatform);
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);
  const activeLayerRef = useRef<0 | 1>(0);
  const shouldPlayRef = useRef(false);
  const handoffFinishTimeoutRef = useRef<number | null>(null);
  const handoffInFlightRef = useRef(false);

  const overlapBlendMs = isDesktopPlatform ? HERO_LOOP_DESKTOP_BLEND_MS : HERO_LOOP_MOBILE_BLEND_MS;
  const overlapThresholdSeconds = isDesktopPlatform
    ? HERO_LOOP_DESKTOP_OVERLAP_THRESHOLD_SECONDS
    : HERO_LOOP_MOBILE_OVERLAP_THRESHOLD_SECONDS;

  useEffect(() => {
    activeLayerRef.current = activeLayer;
  }, [activeLayer]);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const platformQuery = window.matchMedia("(max-width: 820px), (pointer: coarse)");

    const updateMotion = () => {
      setPrefersReducedMotion(reducedMotionQuery.matches);
    };

    const updatePlatform = () => {
      setIsDesktopPlatform(!platformQuery.matches);
    };

    const updateLoopVisibility = () => {
      setLoopVisible(resolveInitialLoopState());
    };

    const updatePageVisibility = () => {
      setIsPageVisible(document.visibilityState === "visible");
    };

    updateMotion();
    updatePlatform();
    updateLoopVisibility();
    updatePageVisibility();

    reducedMotionQuery.addEventListener("change", updateMotion);
    platformQuery.addEventListener("change", updatePlatform);
    document.addEventListener("visibilitychange", updatePageVisibility);

    const observer = new MutationObserver(() => {
      updateLoopVisibility();
      setIsDesktopPlatform(resolveInitialDesktopPlatform());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-public-loop-visible", "data-platform"],
    });

    return () => {
      reducedMotionQuery.removeEventListener("change", updateMotion);
      platformQuery.removeEventListener("change", updatePlatform);
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
      }, overlapBlendMs);
    };

    const attachListeners = (index: 0 | 1, element: HTMLVideoElement | null) => {
      if (!element) {
        return () => undefined;
      }

      const handleTimeUpdate = () => {
        if (index !== activeLayerRef.current || handoffInFlightRef.current) {
          return;
        }

        if (element.currentTime >= overlapThresholdSeconds) {
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
  }, [overlapBlendMs, overlapThresholdSeconds, prefersReducedMotion]);

  const layerVisible = loopVisible || prefersReducedMotion;
  const opacityDurationClass = isDesktopPlatform ? "duration-[460ms]" : "duration-[720ms]";
  const videoScaleClass = isDesktopPlatform ? "scale-[1.01]" : "scale-[1.01] sm:scale-[1.0] lg:scale-[0.98]";
  const posterScaleClass = isDesktopPlatform ? "scale-[1.01]" : "scale-[1.01] sm:scale-[1.0] lg:scale-[0.98]";
  const videoObjectPositionClass = isDesktopPlatform ? "object-[center_-8%]" : "object-[center_-2%]";
  const posterBackgroundPosition = isDesktopPlatform ? "center -8%" : "center -2%";
  const videoBaseClass = `absolute inset-0 h-full w-full ${videoScaleClass} ${videoObjectPositionClass} object-cover transition-opacity ${opacityDurationClass} ease-out will-change-[opacity]`;
  const inactiveLayerClass = `${videoBaseClass} hidden`;
  const videoAClass = activeLayer === 0
    ? isCrossfading
      ? `${videoBaseClass} z-10 opacity-14`
      : `${videoBaseClass} z-10 opacity-30`
    : isCrossfading
      ? `${videoBaseClass} z-20 opacity-30`
      : inactiveLayerClass;
  const videoBClass = activeLayer === 1
    ? isCrossfading
      ? `${videoBaseClass} z-10 opacity-14`
      : `${videoBaseClass} z-10 opacity-30`
    : isCrossfading
      ? `${videoBaseClass} z-20 opacity-30`
      : inactiveLayerClass;

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className={`absolute inset-0 transition-opacity ${opacityDurationClass} ease-out ${layerVisible ? "opacity-100" : "opacity-0"}`}>
        <div
          className={`absolute inset-0 ${posterScaleClass} bg-cover bg-[center_42%] bg-no-repeat transition-opacity ${isDesktopPlatform ? "duration-[420ms]" : "duration-[560ms]"} ease-out ${hasReadyVideo && !prefersReducedMotion ? "opacity-2" : "opacity-24"}`}
          style={{ backgroundImage: `url(${HERO_LOOP_POSTER})`, backgroundPosition: posterBackgroundPosition }}
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
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,6,0.78)_0%,rgba(3,3,6,0.24)_34%,rgba(3,3,6,0.62)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_16%,rgba(2,2,4,0.46)_100%)]" />
    </div>
  );
}
