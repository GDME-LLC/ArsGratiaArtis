"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { FilmArtwork } from "@/components/films/film-artwork";
import { Button } from "@/components/ui/button";
import { getFilmArtworkUrl } from "@/lib/films/artwork";
import {
  HERO_COPY_COLOR_OPTIONS,
  HERO_COPY_SIZE_OPTIONS,
  HERO_PANEL_ORDER,
  PLATFORM_HERO_DESCRIPTION_LIMIT,
  PLATFORM_HERO_MOTTO_LIMIT,
  PLATFORM_HERO_PANEL_DESCRIPTION_LIMIT,
  PLATFORM_HERO_PANEL_KICKER_LIMIT,
  PLATFORM_HERO_PANEL_TITLE_LIMIT,
  PLATFORM_HERO_SUBMOTTO_LIMIT,
  PLATFORM_HERO_TITLE_LIMIT,
  PLATFORM_HOMEPAGE_SPOTLIGHT_LABEL_LIMIT,
  type HeroContentSettings,
  type HeroCopyLine,
  type HeroPanelId,
  type PlatformFilmOption,
  type PlatformSettings,
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
  heroContent: HeroContentSettings;
  beyondCinemaCategories: string[];
};

type HeroLineEditorProps = {
  label: string;
  line: HeroCopyLine;
  maxLength: number;
  multiline?: boolean;
  compact?: boolean;
  onChange: (patch: Partial<HeroCopyLine>) => void;
};

const heroPanelLabels: Record<HeroPanelId, string> = {
  films: "Films",
  creators: "Creators",
  resources: "Resources",
};

function settingsToFormState(settings: PlatformSettings): FormState {
  return {
    homepageSpotlightFilmId: settings.homepageSpotlightFilmId ?? "",
    homepageSpotlightLabel: settings.homepageSpotlightLabel ?? "",
    heroContent: settings.heroContent,
    beyondCinemaCategories: settings.beyondCinemaCategories,
  };
}

function HeroLineEditor({ label, line, maxLength, multiline = false, compact = false, onChange }: HeroLineEditorProps) {
  const controlClassName = "w-full min-w-0 rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground outline-none transition focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]";

  if (compact) {
    return (
      <div className="grid gap-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        {multiline ? (
          <textarea
            value={line.text}
            onChange={(event) => onChange({ text: event.target.value })}
            maxLength={maxLength}
            rows={3}
            className={`min-h-[112px] py-3 ${controlClassName}`}
          />
        ) : (
          <input
            type="text"
            value={line.text}
            onChange={(event) => onChange({ text: event.target.value })}
            maxLength={maxLength}
            className={`h-12 ${controlClassName}`}
          />
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            value={line.color}
            onChange={(event) => onChange({ color: event.target.value as HeroCopyLine["color"] })}
            className={`h-12 ${controlClassName}`}
          >
            {HERO_COPY_COLOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={line.size}
            onChange={(event) => onChange({ size: event.target.value as HeroCopyLine["size"] })}
            className={`h-12 ${controlClassName}`}
          >
            {HERO_COPY_SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-[88px_minmax(0,1fr)_92px_72px] md:items-start">
      <span className="pt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {multiline ? (
        <textarea
          value={line.text}
          onChange={(event) => onChange({ text: event.target.value })}
          maxLength={maxLength}
          rows={3}
          className={`min-h-[88px] py-3 ${controlClassName}`}
        />
      ) : (
        <input
          type="text"
          value={line.text}
          onChange={(event) => onChange({ text: event.target.value })}
          maxLength={maxLength}
          className={`h-12 ${controlClassName}`}
        />
      )}
      <select
        value={line.color}
        onChange={(event) => onChange({ color: event.target.value as HeroCopyLine["color"] })}
        className={`h-12 ${controlClassName}`}
      >
        {HERO_COPY_COLOR_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        value={line.size}
        onChange={(event) => onChange({ size: event.target.value as HeroCopyLine["size"] })}
        className={`h-12 ${controlClassName}`}
      >
        {HERO_COPY_SIZE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
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
  const previewArtworkUrl = previewFilm
    ? getFilmArtworkUrl({ posterUrl: previewFilm.posterUrl, muxPlaybackId: previewFilm.muxPlaybackId })
    : null;

  function updatePrimaryHeroLine(field: keyof Pick<HeroContentSettings, "motto" | "submotto" | "title" | "description">, patch: Partial<HeroCopyLine>) {
    setForm((current) => ({
      ...current,
      heroContent: {
        ...current.heroContent,
        [field]: {
          ...current.heroContent[field],
          ...patch,
        },
      },
    }));
  }

  function updatePanelHeroLine(panel: HeroPanelId, field: keyof HeroContentSettings["panels"][HeroPanelId], patch: Partial<HeroCopyLine>) {
    setForm((current) => ({
      ...current,
      heroContent: {
        ...current.heroContent,
        panels: {
          ...current.heroContent.panels,
          [panel]: {
            ...current.heroContent.panels[panel],
            [field]: {
              ...current.heroContent.panels[panel][field],
              ...patch,
            },
          },
        },
      },
    }));
  }

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
          heroContent: form.heroContent,
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
    <form onSubmit={handleSubmit} className="mt-6 grid w-full min-w-0 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-start">
      <section className="min-w-0 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start">
          <div className="w-full max-w-[220px] shrink-0">
            <FilmArtwork
              artworkUrl={previewArtworkUrl}
              title={previewFilm?.title ?? "Homepage spotlight"}
              className="rounded-[24px]"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="display-kicker">Platform Tools</p>
              <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground/78">
                {form.homepageSpotlightFilmId ? "Manual Spotlight" : "Automatic Spotlight"}
              </span>
            </div>

            <h2 className="headline-lg mt-3 text-foreground">Homepage spotlight</h2>
            <p className="body-sm mt-3 max-w-2xl text-muted-foreground">
              Choose a specific public release for the desktop hero or leave the homepage spotlight on automatic.
            </p>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Spotlight release</span>
                <select
                  value={form.homepageSpotlightFilmId}
                  onChange={(event) => setForm((current) => ({ ...current, homepageSpotlightFilmId: event.target.value }))}
                  className="h-12 w-full min-w-0 rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground outline-none transition focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
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
                  className="h-12 w-full min-w-0 rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
                />
              </label>
            </div>

            {previewFilm ? (
              <div className="mt-5 min-w-0 rounded-[24px] border border-white/10 bg-black/20 p-5">
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
                  <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
                    <a href="/" target="_blank" rel="noreferrer">Preview Homepage</a>
                  </Button>
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <a href={`/film/${previewFilm.slug}`} target="_blank" rel="noreferrer">Open Spotlight Release</a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-5 min-w-0 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-5">
                <p className="display-kicker">No Spotlight Yet</p>
                <p className="body-sm mt-3 text-muted-foreground">
                  Once public releases are available, the current above-the-fold spotlight will appear here for review.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-5">
        <section className="min-w-0 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="display-kicker">Hero Copy</p>
            <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground/78">
              Compact editor
            </span>
          </div>

          <div className="mt-4 space-y-5">
            <div>
              <div className="grid gap-3">
                <HeroLineEditor label="Motto" line={form.heroContent.motto} maxLength={PLATFORM_HERO_MOTTO_LIMIT} onChange={(patch) => updatePrimaryHeroLine("motto", patch)} />
                <HeroLineEditor label="Line 2" line={form.heroContent.submotto} maxLength={PLATFORM_HERO_SUBMOTTO_LIMIT} onChange={(patch) => updatePrimaryHeroLine("submotto", patch)} />
                <HeroLineEditor label="Title" line={form.heroContent.title} maxLength={PLATFORM_HERO_TITLE_LIMIT} multiline onChange={(patch) => updatePrimaryHeroLine("title", patch)} />
                <HeroLineEditor label="Body" line={form.heroContent.description} maxLength={PLATFORM_HERO_DESCRIPTION_LIMIT} multiline onChange={(patch) => updatePrimaryHeroLine("description", patch)} />
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Manifesto Hero</p>
              <div className="mt-3 grid gap-4 lg:grid-cols-3">
                {HERO_PANEL_ORDER.map((panel) => (
                  <div key={panel} className="min-w-0 rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="display-kicker">{heroPanelLabels[panel]}</p>
                    <div className="mt-3 grid gap-3">
                      <HeroLineEditor
                        label="Heading"
                        line={form.heroContent.panels[panel].kicker}
                        maxLength={PLATFORM_HERO_PANEL_KICKER_LIMIT}
                        compact
                        onChange={(patch) => updatePanelHeroLine(panel, "kicker", patch)}
                      />
                      <HeroLineEditor
                        label="Title"
                        line={form.heroContent.panels[panel].title}
                        maxLength={PLATFORM_HERO_PANEL_TITLE_LIMIT}
                        multiline
                        compact
                        onChange={(patch) => updatePanelHeroLine(panel, "title", patch)}
                      />
                      <HeroLineEditor
                        label="Body"
                        line={form.heroContent.panels[panel].description}
                        maxLength={PLATFORM_HERO_PANEL_DESCRIPTION_LIMIT}
                        multiline
                        compact
                        onChange={(patch) => updatePanelHeroLine(panel, "description", patch)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="min-w-0 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
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

        {error || success ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${error ? "border border-destructive/40 bg-destructive/10 text-destructive" : "border border-primary/30 bg-primary/10 text-primary"}`}>
            {error ?? success}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button type="submit" size="lg" disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? "Saving..." : "Save Platform Settings"}
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
            <a href="/" target="_blank" rel="noreferrer">Open Homepage</a>
          </Button>
        </div>
      </div>
    </form>
  );
}
