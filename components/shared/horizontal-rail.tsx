"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HorizontalRailProps = {
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
};

export function HorizontalRail({ children, ariaLabel, className }: HorizontalRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const suppressClickRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [desktopDragging, setDesktopDragging] = useState(false);

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

    const amount = Math.max(node.clientWidth * 0.82, 220) * direction;
    const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({ left: amount, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }

  function handleRailKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const node = railRef.current;

    if (!node) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByAmount(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByAmount(1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      node.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      node.scrollTo({ left: node.scrollWidth, behavior: "smooth" });
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const node = railRef.current;

    if (!node || !hasOverflow || event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement | null;

    if (target?.closest("a, button, input, select, textarea, [role='button'], [data-no-drag-rail='true']")) {
      return;
    }

    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    suppressClickRef.current = false;
    dragStartXRef.current = event.clientX;
    dragStartScrollLeftRef.current = node.scrollLeft;
    node.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const node = railRef.current;

    if (!node || !isPointerDownRef.current || event.pointerType !== "mouse") {
      return;
    }

    const deltaX = event.clientX - dragStartXRef.current;

    if (!isDraggingRef.current && Math.abs(deltaX) > 4) {
      isDraggingRef.current = true;
      setDesktopDragging(true);
    }

    if (!isDraggingRef.current) {
      return;
    }

    suppressClickRef.current = true;
    node.scrollLeft = dragStartScrollLeftRef.current - deltaX;
    event.preventDefault();
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") {
      return;
    }

    isPointerDownRef.current = false;
    isDraggingRef.current = false;
    setDesktopDragging(false);
  }

  function handleRailClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }

  return (
    <div
      className={cn("group/rail relative", className)}
      data-rail-overflow={hasOverflow ? "true" : "false"}
      data-can-scroll-left={canScrollLeft ? "true" : "false"}
      data-can-scroll-right={canScrollRight ? "true" : "false"}
    >
      {hasOverflow ? (
        <>
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-12 bg-gradient-to-r from-background via-background/70 to-transparent transition-opacity duration-300 lg:block",
              canScrollLeft ? "opacity-100" : "opacity-0"
            )}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-16 bg-gradient-to-l from-background via-background/70 to-transparent transition-opacity duration-300 lg:block",
              canScrollRight ? "opacity-100" : "opacity-0"
            )}
          />

          <div
            data-rail-nav="left"
            className="pointer-events-none absolute inset-y-0 left-1 z-20 flex items-center opacity-100 transition sm:left-2 sm:opacity-90 sm:group-hover/rail:opacity-100 sm:group-focus-within/rail:opacity-100"
          >
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="pointer-events-auto h-9 w-9 rounded-full border border-white/16 bg-black/50 p-0 text-foreground shadow-[0_10px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm transition hover:border-white/28 hover:bg-black/65 disabled:opacity-35 sm:h-10 sm:w-10"
              onClick={() => scrollByAmount(-1)}
              disabled={!canScrollLeft}
              aria-label={`Scroll ${ariaLabel} left`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div
            data-rail-nav="right"
            className="pointer-events-none absolute inset-y-0 right-1 z-20 flex items-center opacity-100 transition sm:right-2 sm:opacity-90 sm:group-hover/rail:opacity-100 sm:group-focus-within/rail:opacity-100"
          >
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="pointer-events-auto h-9 w-9 rounded-full border border-white/16 bg-black/50 p-0 text-foreground shadow-[0_10px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm transition hover:border-white/28 hover:bg-black/65 disabled:opacity-35 sm:h-10 sm:w-10"
              onClick={() => scrollByAmount(1)}
              disabled={!canScrollRight}
              aria-label={`Scroll ${ariaLabel} right`}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </>
      ) : null}

      <div
        ref={railRef}
        aria-label={ariaLabel}
        role="region"
        tabIndex={0}
        className="horizontal-rail-scroll -mx-1 flex gap-3 px-1 pb-3 pt-1 outline-none sm:mx-0 sm:gap-4 sm:px-0 sm:pr-[8vw]"
        data-desktop-drag={hasOverflow ? "enabled" : "disabled"}
        data-desktop-dragging={desktopDragging ? "true" : "false"}
        onKeyDown={handleRailKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onClickCapture={handleRailClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
