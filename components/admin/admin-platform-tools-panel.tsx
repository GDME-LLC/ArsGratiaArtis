"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { FilmArtwork } from "@/components/films/film-artwork";
import { Button } from "@/components/ui/button";
import {
  type PlatformFilmOption,
  type PlatformSettings,
  PLATFORM_HERO_DESCRIPTION_LIMIT,
  PLATFORM_HERO_MOTTO_LIMIT,
  PLATFORM_HERO_TITLE_LIMIT,
  PLATFORM_HOMEPAGE_SPOTLIGHT_LABEL_LIMIT,
} from "@/lib/platform-settings-shared";
import { BEYOND_CINEMA_CATEGORIES, FILM_CATEGORY_LABELS } from "@/lib/films/categories";
import type { PublicFilmCard } from "@/types";

type AdminPlatformToolsPanelProps = {
  initialSettings: PlatformSettings;
  filmOptions: PlatformFilmOption[];
  currentAutoSpotlightFilm: PublicFilmCard | null;
  currentAutoSpotlightLabel: string;
};

type FormState = {
  homepageSpotlightFilmId: string;
  homepageSpotlightLabel: string;
  heroMotto: string;
  heroTitle: string;
  heroDescription: string;
  beyondCinemaCategories: string[];
};

function settingsToFormState(settings: PlatformSettings): FormState {
  return {
    homepageSpotlightFilmId: settings.homepageSpotlightFilmId ?? "",
    homepageSpotlightLabel: settings.homepageSpotlightLabel ?? "",
    heroMotto: settings.heroMotto,
    heroTitle: settings.heroTitle,
    heroDescription: settings.heroDescription,
    beyondCinemaCategories: settings.beyondCinemaCategories,
  };
}

export function AdminPlatformToolsPanel({
  initialSettings,
  filmOptions,
  currentAutoSpotlightFilm,
  currentAutoSpotlightLabel,
}: AdminPlatformToolsPanelProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => settingsToFormState(initialSettings));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedManualFilm = useMemo(
    () => filmOptions.find((film) => film.id === form.homepageSpotlightFilmId) ?? null,
    [filmOptions, form.homepageSpotlightFilmId],
  );

  const previewFilm = selectedManualFilm ?? currentAutoSpotlightFilm;
  const previewLabel = form.homepageSpotlightFilmId
    ? form.homepageSpotlightLabel.trim() || "Featured Film"
    : currentAutoSpotlightLabel;

  function toggleBeyondCinemaCategory(category: string) {
    setForm((current) => {
      const exists = current.beyondCinemaCategories.includes(category);

      return {
        ...current,
        beyondCinemaCategories: exists
          ? current.beyondCinemaCategories.filter((value) => value !== category)
          : [...current.beyondCinemaCategories, category],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          homepageSpotlightFilmId: form.homepageSpotlightFilmId || null,
          homepageSpotlightLabel: form.homepageSpotlightLabel || null,
          heroMotto: form.heroMotto,
          heroTitle: form.heroTitle,
          heroDescription: form.heroDescription,
          beyondCinemaCategories: form.beyondCinemaCategories,
        }),
      });

      const body = (await response.json()) as {
        error?: string;
        settings?: PlatformSettings;
      };

      if (!response.ok || !body.settings) {
        setError(body.error ?? "Platform settings could not be saved.");
        return;
      }

      setForm(settingsToFormState(body.settings));
      setSuccess("Platform settings saved.");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] xl:items-start">
      <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="w-full max-w-[220px] shrink-0">
            <FilmArtwork
              artworkUrl={previewFilm?.posterUrl ?? null}
              title={previewFilm?.title ?? "Homepage spotlight"}
              className="rounded-[24px]"
            />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="display-kicker">Platform Tools</p>
              <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground/78">
                {form.homepageSpotlightFilmId ? "Manual Spotlight" : "Automatic Spotlight"}
              </span>
            </div>

            <h2 className="headline-lg mt-3 text-foreground">Homepage spotlight</h2>
            <p className="body-sm mt-3 max-w-2xl text-muted-foreground">
              Promote a specific public release above the fold on desktop, or leave the selection on automatic so staff picks and featured films continue
              to drive the homepage hero.
            </p>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Spotlight release</span>
                <select
                  value={form.homepageSpotlightFilmId}
                  onChange={(event) => setForm((current) => ({ ...current, homepageSpotlightFilmId: event.target.value }))}
                  className="h-12 rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground outline-none transition focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
                >
                  <option value="">Automatic homepage selection</option>
                  {filmOptions.map((film) => (
                    <option key={film.id} value={film.id}>
                      {film.staffPick ? "[Staff Pick] " : ""}
                      {film.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Spotlight label</span>
                <input
                  type="text"
                  value={form.homepageSpotlightLabel}
                  onChange={(event) => setForm((current) => ({ ...current, homepageSpotlightLabel: event.target.value }))}
                  placeholder="Featured Film"
                  maxLength={PLATFORM_HOMEPAGE_SPOTLIGHT_LABEL_LIMIT}
                  className="h-12 rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
                />
              </label>
            </div>

            {previewFilm ? (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="display-kicker">Preview</p>
                <h3 className="title-md mt-3 text-foreground">{previewFilm.title}</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">{previewLabel}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {selectedManualFilm?.categoryLabel ?? FILM_CATEGORY_LABELS[previewFilm.category]}
                </p>
                <p className="body-sm mt-3 text-muted-foreground">
                  {selectedManualFilm?.synopsis ?? previewFilm.synopsis ?? "A published release currently pulled into the homepage hero spotlight."}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button asChild variant="ghost" size="lg">
                    <a href="/" target="_blank" rel="noreferrer">Preview Homepage</a>
                  </Button>
                  <Button asChild size="lg">
                    <a href={`/film/${previewFilm.slug}`} target="_blank" rel="noreferrer">Open Spotlight Release</a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-5">
                <p className="display-kicker">No Spotlight Yet</p>
                <p className="body-sm mt-3 text-muted-foreground">
                  Once public releases are available, the current above-the-fold spotlight will appear here for review.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-5">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="display-kicker">Hero Copy</p>
            <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground/78">
              Editable now
            </span>
          </div>
          <h2 className="title-md mt-3 text-foreground">Homepage hero messaging</h2>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Motto</span>
              <input
                type="text"
                value={form.heroMotto}
                onChange={(event) => setForm((current) => ({ ...current, heroMotto: event.target.value }))}
                maxLength={PLATFORM_HERO_MOTTO_LIMIT}
                className="h-12 rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground outline-none transition focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Hero title</span>
              <input
                type="text"
                value={form.heroTitle}
                onChange={(event) => setForm((current) => ({ ...current, heroTitle: event.target.value }))}
                maxLength={PLATFORM_HERO_TITLE_LIMIT}
                className="h-12 rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground outline-none transition focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Hero description</span>
              <textarea
                value={form.heroDescription}
                onChange={(event) => setForm((current) => ({ ...current, heroDescription: event.target.value }))}
                maxLength={PLATFORM_HERO_DESCRIPTION_LIMIT}
                rows={4}
                className="min-h-[116px] rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="display-kicker">Beyond Cinema</p>
            <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground/78">
              Homepage inputs
            </span>
          </div>
          <h2 className="title-md mt-3 text-foreground">Category-driven homepage sections</h2>
          <p className="body-sm mt-3 text-muted-foreground">
            Choose which Beyond Cinema categories feed the homepage discovery rails and the Beyond Cinema browse surface.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {BEYOND_CINEMA_CATEGORIES.map((category) => {
              const active = form.beyondCinemaCategories.includes(category);

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleBeyondCinemaCategory(category)}
                  className={`rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.18em] transition ${active ? "border-primary/40 bg-primary/12 text-primary" : "border-white/10 bg-black/20 text-foreground/78 hover:bg-white/[0.05]"}`}
                >
                  {FILM_CATEGORY_LABELS[category]}
                </button>
              );
            })}
          </div>
        </section>

        {(error || success) ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${error ? "border border-destructive/40 bg-destructive/10 text-destructive" : "border border-primary/30 bg-primary/10 text-primary"}`}>
            {error ?? success}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Platform Settings"}
          </Button>
          <Button asChild variant="ghost" size="lg">
            <a href="/" target="_blank" rel="noreferrer">Open Homepage</a>
          </Button>
        </div>
      </div>
    </form>
  );
}

