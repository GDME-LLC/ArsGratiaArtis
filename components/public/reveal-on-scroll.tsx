"use client";

import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type RevealOnScrollProps = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

export function RevealOnScroll({ as: Component = "div", className, children }: RevealOnScrollProps) {
  return (
    <Component data-reveal className={cn("public-reveal", className)}>
      {children}
    </Component>
  );
}
