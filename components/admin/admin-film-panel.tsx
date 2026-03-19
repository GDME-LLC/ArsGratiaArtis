"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { FilmArtwork } from "@/components/films/film-artwork";
import { Button } from "@/components/ui/button";
import { getModerationStatusLabel } from "@/lib/films/moderation";
import { formatReleaseDate } from "@/lib/utils";
import type { AdminFilmAction, AdminFilmRow } from "@/types";

type AdminFilmPanelProps = {
  films: AdminFilmRow[];
};

type SaveState = {
  pendingId?: string;
  error?: string;
  success?: string;
};

function getFilterLabel(film: AdminFilmRow) {
  if (film.publishStatus === "draft") {
    return "draft";
  }

  if (film.visibility !== "public") {
    return "hidden";
  }

  return "published";
}

function getStatusCopy(film: AdminFilmRow) {
  const parts: string[] = [film.publishStatus, film.visibility];

  if (film.moderationStatus !== "active") {
    parts.push(getModerationStatusLabel(film.moderationStatus));
  }

  return parts.join(" / ");
}

export function AdminFilmPanel({ films }: AdminFilmPanelProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "hidden">("all");
  const [saveState, setSaveState] = useState<SaveState>({});

  const filteredFilms = useMemo(() => {
    if (filter === "all") {
      return films;
    }

    return films.filter((film) => getFilterLabel(film) === filter);
  }, [films, filter]);

  async function handleAction(filmId: string, action: AdminFilmAction) {
    setSaveState({ pendingId: filmId });

    try {
      const response = await fetch("/api/admin/films", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filmId,
          action,
        }),
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSaveState({ error: body.error ?? "Film action failed." });
        return;
      }

      setSaveState({
        success: action === "hide" ? "Film hidden from public view." : "Film moved back to draft.",
      });
      router.refresh();
    } catch {
      setSaveState({ error: "Network error. Try again." });
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-black/20 p-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="display-kicker">Film Controls</p>
          <h2 className="headline-lg mt-3">Recent releases and drafts</h2>
          <p className="body-sm mt-3 max-w-2xl">
            This keeps the admin surface practical: review recent film records, check public status, and quickly hide or unpublish a release if needed.
          </p>
        </div>

        <label className="grid gap-2 text-sm text-muted-foreground">
          <span className="display-kicker text-[0.65rem] text-foreground/90">Filter</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as typeof filter)}
            className={selectClassName}
          >
            <option className={selectOptionClassName} value="all">All recent films</option>
            <option className={selectOptionClassName} value="published">Published</option>
            <option className={selectOptionClassName} value="draft">Drafts</option>
            <option className={selectOptionClassName} value="hidden">Hidden</option>
          </select>
        </label>
      </div>

      {saveState.error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveState.error}
        </div>
      ) : null}

      {saveState.success ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {saveState.success}
        </div>
      ) : null}

      {filteredFilms.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
          <p className="display-kicker">No Matches</p>
          <p className="title-md mt-3 text-foreground">Nothing in this filter right now</p>
          <p className="body-sm mt-3">Try another status filter to review a different slice of recent film activity.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredFilms.map((film) => (
            <article key={film.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                  <div className="w-[96px] shrink-0">
                    <FilmArtwork artworkUrl={film.posterUrl} title={film.title} className="rounded-[20px]" />
                  </div>
                  <div className="max-w-3xl">
                    <p className="display-kicker">@{film.creator.handle || "unknown"}</p>
                    <h3 className="title-md mt-3 text-foreground">{film.title}</h3>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      {getStatusCopy(film)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      slug / {film.slug}
                    </p>
                    <p className="body-sm mt-3">
                      {film.synopsis || "No synopsis added yet."}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Creator: <span className="text-foreground">{film.creator.displayName || film.creator.handle || "Unknown creator"}</span>
                      {" · "}
                      Updated {formatReleaseDate(film.updatedAt) ?? "recently"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {film.publishStatus === "published" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      disabled={saveState.pendingId === film.id}
                      onClick={() => {
                        void handleAction(film.id, "unpublish");
                      }}
                    >
                      {saveState.pendingId === film.id ? "Saving..." : "Unpublish"}
                    </Button>
                  ) : null}
                  {film.visibility === "public" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      disabled={saveState.pendingId === film.id}
                      onClick={() => {
                        void handleAction(film.id, "hide");
                      }}
                    >
                      {saveState.pendingId === film.id ? "Saving..." : "Hide"}
                    </Button>
                  ) : null}
                  {film.publishStatus === "published" && film.visibility === "public" ? (
                    <Button asChild size="lg">
                      <Link href={`/film/${film.slug}`}>Open Release Page</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const selectClassName =
  "h-12 rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition focus:border-primary/60 focus:bg-[hsl(var(--surface-3))] focus:text-foreground [color-scheme:dark] [&>option]:bg-[#11141c] [&>option]:text-[#f4eee4]";

const selectOptionClassName = "bg-[#11141c] text-[#f4eee4]";
