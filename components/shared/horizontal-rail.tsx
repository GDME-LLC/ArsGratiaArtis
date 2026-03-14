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

  useEffect(() => {
    function updateState() {
      const node = railRef.current;

      if (!node) {
        return;
      }

      setCanScrollLeft(node.scrollLeft > 8);
      setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 8);
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

    const amount = Math.max(node.clientWidth * 0.8, 280) * direction;
    node.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-12 bg-gradient-to-r from-background to-transparent lg:block" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-12 bg-gradient-to-l from-background to-transparent lg:block" />

      <div className="absolute right-3 top-[-4.5rem] hidden gap-2 lg:flex">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="h-10 w-10 rounded-full p-0"
          onClick={() => scrollByAmount(-1)}
          disabled={!canScrollLeft}
          aria-label={`Scroll ${ariaLabel} left`}
        >
          <span aria-hidden="true">?</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="h-10 w-10 rounded-full p-0"
          onClick={() => scrollByAmount(1)}
          disabled={!canScrollRight}
          aria-label={`Scroll ${ariaLabel} right`}
        >
          <span aria-hidden="true">?</span>
        </Button>
      </div>

      <div
        ref={railRef}
        aria-label={ariaLabel}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-[10vw] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}
