"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type FilmArtworkProps = {
  artworkUrl?: string | null;
  previewUrl?: string | null;
  title: string;
  label?: string;
  className?: string;
  imageClassName?: string;
};

export function FilmArtwork({
  artworkUrl,
  previewUrl,
  title,
  label = "Poster-led release",
  className,
  imageClassName,
}: FilmArtworkProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [previewRequested, setPreviewRequested] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  function handleMouseEnter() {
    setIsHovered(true);

    if (previewUrl) {
      setPreviewRequested(true);
    }
  }

  function handleMouseLeave() {
    setIsHovered(false);
  }

  return (
    <div
      className={cn(
        "group/artwork relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-black/40 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(0,0,0,0.38)]",
        className,
      )}
      style={{ aspectRatio: "2 / 3", maxHeight: "420px" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {artworkUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artworkUrl}
            alt={`${title} artwork`}
            loading="lazy"
            decoding="async"
            className={cn(
              "h-full w-full object-cover transition duration-500 group-hover/artwork:scale-[1.03]",
              imageClassName,
            )}
          />
          {previewRequested && previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                loading="lazy"
                decoding="async"
                aria-hidden="true"
                onLoad={() => setPreviewLoaded(true)}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition duration-300",
                  isHovered && previewLoaded ? "opacity-100" : "opacity-0",
                  imageClassName,
                )}
              />
            </>
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,6,0.06),rgba(4,4,6,0.42),rgba(4,4,6,0.76))]" />
        </>
      ) : (
        <div className="flex h-full items-end bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015)),radial-gradient(circle_at_top,rgba(199,166,106,0.1),transparent_38%)] p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            {label}
          </p>
        </div>
      )}
    </div>
  );
}
