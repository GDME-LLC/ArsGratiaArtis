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
    node.addEventListener("scroll", updateState, { passive: true });
    window.addEventListener("resize", updateState);

    return () => {
      node.removeEventListener("scroll", updateState);
      window.removeEventListener("resize", updateState);
    };
  }, []);

  function scrollByAmount(direction: -1 | 1) {
    const node = railRef.current;

    if (!node) {
      return;
    }

    const amount = Math.max(node.clientWidth * 0.82, 320) * direction;
    node.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <div className={cn("group/rail relative", className)}>
      {hasOverflow ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-12 bg-gradient-to-r from-background via-background/70 to-transparent lg:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-16 bg-gradient-to-l from-background via-background/70 to-transparent lg:block" />

          <div className="pointer-events-none absolute inset-y-0 left-2 z-20 hidden items-center opacity-0 transition group-hover/rail:opacity-100 group-focus-within/rail:opacity-100 lg:flex">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="pointer-events-auto h-10 w-10 rounded-full border border-white/10 bg-black/35 p-0 backdrop-blur-sm"
              onClick={() => scrollByAmount(-1)}
              disabled={!canScrollLeft}
              aria-label={`Scroll ${ariaLabel} left`}
            >
              <span aria-hidden="true">&lt;</span>
            </Button>
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-2 z-20 hidden items-center opacity-0 transition group-hover/rail:opacity-100 group-focus-within/rail:opacity-100 lg:flex">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="pointer-events-auto h-10 w-10 rounded-full border border-white/10 bg-black/35 p-0 backdrop-blur-sm"
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
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-[10vw] pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}
