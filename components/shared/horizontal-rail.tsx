"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HorizontalRailProps = {
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
};

export function HorizontalRail({ children, ariaLabel, className }: HorizontalRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchStartScrollLeftRef = useRef(0);
  const touchHorizontalActiveRef = useRef(false);
  const touchTrackingRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    function updateState() {
      const node = railRef.current;

      if (!node) {
        return;
      }

      const overflow = node.scrollWidth > node.clientWidth + 8;
      setHasOverflow(overflow);
      setCanScrollLeft(overflow && node.scrollLeft > 8);
      setCanScrollRight(overflow && node.scrollLeft + node.clientWidth < node.scrollWidth - 8);
    }

    const node = railRef.current;

    if (!node) {
      return;
    }

    updateState();

    const resizeObserver = new ResizeObserver(updateState);
    resizeObserver.observe(node);

    node.addEventListener("scroll", updateState, { passive: true });
    window.addEventListener("resize", updateState);

    return () => {
      resizeObserver.disconnect();
      node.removeEventListener("scroll", updateState);
      window.removeEventListener("resize", updateState);
    };
  }, [children]);

  function scrollByAmount(direction: -1 | 1) {
    const node = railRef.current;

    if (!node) {
      return;
    }

    const amount = node.clientWidth * direction;
    node.scrollBy({ left: amount, behavior: "smooth" });
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const node = railRef.current;
    const touch = event.touches[0];

    if (!node || !touch) {
      return;
    }

    touchTrackingRef.current = true;
    touchHorizontalActiveRef.current = false;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchStartScrollLeftRef.current = node.scrollLeft;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    const node = railRef.current;
    const touch = event.touches[0];

    if (!node || !touch || !touchTrackingRef.current) {
      return;
    }

    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Only lock to horizontal once intentional horizontal movement is clear.
    if (!touchHorizontalActiveRef.current) {
      if (absY > 12 && absY > absX) {
        touchTrackingRef.current = false;
        return;
      }

      if (absX > 14 && absX > absY + 6) {
        touchHorizontalActiveRef.current = true;
      } else {
        return;
      }
    }

    event.preventDefault();
    node.scrollLeft = touchStartScrollLeftRef.current - deltaX;
  }

  function handleTouchEnd() {
    touchTrackingRef.current = false;
    touchHorizontalActiveRef.current = false;
  }

  return (
    <div className={cn("group/rail relative", className)}>
      {hasOverflow ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-12 bg-gradient-to-r from-background via-background/70 to-transparent lg:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-16 bg-gradient-to-l from-background via-background/70 to-transparent lg:block" />

          <div className="pointer-events-none absolute inset-y-0 left-1 z-20 flex items-center opacity-100 transition sm:left-2 sm:opacity-90 sm:group-hover/rail:opacity-100 sm:group-focus-within/rail:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="pointer-events-auto h-9 w-9 rounded-full border border-white/12 bg-black/45 p-0 backdrop-blur-sm sm:h-10 sm:w-10"
              onClick={() => scrollByAmount(-1)}
              disabled={!canScrollLeft}
              aria-label={`Scroll ${ariaLabel} left`}
            >
              <span aria-hidden="true">&lt;</span>
            </Button>
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-1 z-20 flex items-center opacity-100 transition sm:right-2 sm:opacity-90 sm:group-hover/rail:opacity-100 sm:group-focus-within/rail:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="pointer-events-auto h-9 w-9 rounded-full border border-white/12 bg-black/45 p-0 backdrop-blur-sm sm:h-10 sm:w-10"
              onClick={() => scrollByAmount(1)}
              disabled={!canScrollRight}
              aria-label={`Scroll ${ariaLabel} right`}
            >
              <span aria-hidden="true">&gt;</span>
            </Button>
          </div>
        </>
      ) : null}

      <div
        ref={railRef}
        aria-label={ariaLabel}
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden px-1 pb-3 pt-1 overscroll-x-contain sm:mx-0 sm:gap-4 sm:px-0 sm:pr-[8vw] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y pinch-zoom" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
