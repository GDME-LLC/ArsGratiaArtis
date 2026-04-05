"use client";

import { useMemo, useState } from "react";

import { PublicFilmFeed } from "@/components/films/public-film-feed";
import { SectionShell } from "@/components/marketing/section-shell";
import { FILM_CATEGORY_LABELS, type FilmCategory } from "@/lib/films/categories";
import type { PublicFilmCard } from "@/types";

type BeyondCinemaRailProps = {
  categories: FilmCategory[];
  filmsByCategory: Partial<Record<FilmCategory, PublicFilmCard[]>>;
  className?: string;
};

export function BeyondCinemaRail({ categories, filmsByCategory, className = "mt-6 sm:mt-7" }: BeyondCinemaRailProps) {
  const initialCategory = useMemo(() => {
    const withFilms = categories.find((category) => (filmsByCategory[category] ?? []).length > 0);
    return withFilms ?? categories[0] ?? null;
  }, [categories, filmsByCategory]);

  const [selectedCategory, setSelectedCategory] = useState<FilmCategory | null>(initialCategory);

  if (!selectedCategory) {
    return null;
  }

  const selectedFilms = filmsByCategory[selectedCategory] ?? [];
  const categoryLabel = FILM_CATEGORY_LABELS[selectedCategory];

  return (
    <SectionShell className={className}>
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="headline-lg text-foreground">Beyond Cinema</h2>
          <label className="inline-flex items-center gap-2 rounded-2xl border border-white/16 bg-black/24 px-3 py-2 text-sm text-foreground/88">
            <span className="text-[11px] uppercase tracking-[0.14em] text-foreground/66">Category</span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value as FilmCategory)}
              className="min-w-[10.25rem] rounded-xl border border-white/16 bg-black/40 px-2 py-1 text-sm text-foreground outline-none transition focus:border-white/36"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {FILM_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="body-lg mt-3">Explore {categoryLabel} releases from the broader Beyond Cinema ecosystem.</p>
      </div>

      <div className="mt-6">
        {selectedFilms.length > 0 ? (
          <PublicFilmFeed films={selectedFilms} variant="row" />
        ) : (
          <div className="rounded-2xl border border-white/12 bg-black/24 p-4 text-sm text-foreground/74">
            No public releases in this category yet.
          </div>
        )}
      </div>
    </SectionShell>
  );
}
