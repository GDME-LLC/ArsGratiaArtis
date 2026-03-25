"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { FilmArtwork } from "@/components/films/film-artwork";
import { Button } from "@/components/ui/button";
import { getModerationStatusLabel } from "@/lib/films/moderation";
import { formatReleaseDate } from "@/lib/utils";
import type { AdminFilmAction, AdminModerationOverview, AdminReportedFilmRow } from "@/types";

type AdminFilmPanelProps = {
  overview: AdminModerationOverview;
};

type SaveState = {
  pendingId?: string;
  error?: string;
  success?: string;
};

function getStatusCopy(film: AdminReportedFilmRow) {
  const parts: string[] = [film.publishStatus, film.visibility];

  if (film.moderationStatus !== "active") {
    parts.push(getModerationStatusLabel(film.moderationStatus));
  }

  return parts.join(" / ");
}

export function AdminFilmPanel({ overview }: AdminFilmPanelProps) {
  const router = useRouter();
  const [search, setSearch] = useState(overview.search);
  const [saveState, setSaveState] = useState<SaveState>({});

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
      <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="display-kicker">Moderation Search</p>
            <h2 className="headline-lg mt-3">Reported films and users</h2>
            <p className="body-sm mt-3 max-w-2xl">
              Search by film title, release slug, creator handle, or display name. Only accounts and releases with active reports are shown here.
            </p>
          </div>

          <form action="/admin/films" className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
            <input
              type="search"
              name="q"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reported films or users"
              className="h-12 flex-1 rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
            />
            <Button type="submit" size="lg">
              Search Reports
            </Button>
            {overview.search ? (
              <Button asChild type="button" variant="ghost" size="lg">
                <Link href="/admin/films">Clear</Link>
              </Button>
            ) : null}
          </form>
        </div>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="display-kicker">Reported Films</p>
          <p className="title-md mt-3 text-foreground">{overview.reportedFilms.length}</p>
          <p className="body-sm mt-3">Release records currently matching the report search.</p>
        </article>
        <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="display-kicker">Reported Users</p>
          <p className="title-md mt-3 text-foreground">{overview.reportedProfiles.length}</p>
          <p className="body-sm mt-3">Profiles with active reports that need review.</p>
        </article>
      </div>

      <section className="grid gap-4">
        <div>
          <p className="display-kicker">Films</p>
          <h3 className="title-md mt-3 text-foreground">Reported releases</h3>
        </div>

        {overview.reportedFilms.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
            <p className="display-kicker">No Matches</p>
            <p className="title-md mt-3 text-foreground">No reported films found</p>
            <p className="body-sm mt-3">Try another search term, or clear the search to review all currently reported releases.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {overview.reportedFilms.map((film) => (
              <article key={film.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <div className="w-[96px] shrink-0">
                      <FilmArtwork artworkUrl={film.posterUrl} title={film.title} className="rounded-[20px]" />
                    </div>
                    <div className="max-w-3xl">
                      <p className="display-kicker">@{film.creator.handle || "unknown"}</p>
                      <h3 className="title-md mt-3 text-foreground">{film.title}</h3>
                      <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">{getStatusCopy(film)}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">slug / {film.slug}</p>
                      <p className="mt-3 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-100">
                        {film.openReportCount} active report{film.openReportCount === 1 ? "" : "s"}
                      </p>
                      <p className="body-sm mt-3">{film.synopsis || "No synopsis added yet."}</p>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Creator: <span className="text-foreground">{film.creator.displayName || film.creator.handle || "Unknown creator"}</span>
                        {" · "}
                        Latest report {formatReleaseDate(film.latestReportAt) ?? "recently"}
                      </p>
                      {film.reportReasons.length > 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">Reasons: {film.reportReasons.join(", ")}</p>
                      ) : null}
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
                    <Button asChild variant="ghost" size="lg">
                      <Link href={`/creator/${film.creator.handle}`}>Open Creator</Link>
                    </Button>
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
      </section>

      <section className="grid gap-4">
        <div>
          <p className="display-kicker">Users</p>
          <h3 className="title-md mt-3 text-foreground">Reported profiles</h3>
        </div>

        {overview.reportedProfiles.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
            <p className="display-kicker">No Matches</p>
            <p className="title-md mt-3 text-foreground">No reported users found</p>
            <p className="body-sm mt-3">Try another search term, or clear the search to review all currently reported profiles.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {overview.reportedProfiles.map((profile) => (
              <article key={profile.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="display-kicker">{profile.isCreator ? "Creator profile" : "User profile"}</p>
                    <h3 className="title-md mt-3 text-foreground">{profile.displayName || profile.handle || "Unknown user"}</h3>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">@{profile.handle || "unknown"}</p>
                    <p className="mt-3 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-100">
                      {profile.openReportCount} active report{profile.openReportCount === 1 ? "" : "s"}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Visibility: <span className="text-foreground">{profile.isPublic ? "public" : "private"}</span>
                      {" · "}
                      Latest report {formatReleaseDate(profile.latestReportAt) ?? "recently"}
                    </p>
                    {profile.reportReasons.length > 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">Reasons: {profile.reportReasons.join(", ")}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button asChild variant="ghost" size="lg">
                      <Link href={`/creator/${profile.handle}`}>Open Profile</Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
