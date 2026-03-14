export const FILM_CATEGORY_VALUES = [
  "film",
  "series",
  "animation",
  "experimental",
  "commercial",
  "educational",
  "news",
  "short",
] as const;

export type FilmCategory = (typeof FILM_CATEGORY_VALUES)[number];

export const FILM_CATEGORY_LABELS: Record<FilmCategory, string> = {
  film: "Film",
  series: "Series",
  animation: "Animation",
  experimental: "Experimental",
  commercial: "Commercial",
  educational: "Educational",
  news: "News / Commentary",
  short: "Short",
};

export const BEYOND_CINEMA_CATEGORIES: FilmCategory[] = [
  "animation",
  "experimental",
  "commercial",
  "news",
  "short",
];

export function isFilmCategory(value: string): value is FilmCategory {
  return FILM_CATEGORY_VALUES.includes(value as FilmCategory);
}

export function getFilmCategoryLabel(category: FilmCategory | null | undefined) {
  if (!category) {
    return FILM_CATEGORY_LABELS.film;
  }

  return FILM_CATEGORY_LABELS[category];
}
