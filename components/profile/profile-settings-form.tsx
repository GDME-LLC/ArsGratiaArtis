"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ImageUploadField } from "@/components/shared/image-upload-field";
import { Button } from "@/components/ui/button";
import { CREATIVE_PROCESS_SUMMARY_LIMIT, MAX_TOOL_SELECTIONS, normalizeToolSlugs } from "@/lib/constants/process";
import {
  defaultTheatreSettings,
  normalizeTheatreSettings,
  theatreSectionDefinitions,
  THEATRE_OPENING_STATEMENT_LIMIT,
} from "@/lib/theatre";
import { cn } from "@/lib/utils";
import type {
  CreatorFilmListItem,
  CreatorTheatreSettings,
  Profile,
  TheatreSectionId,
  ToolOption,
} from "@/types";

type ProfileSettingsFormProps = {
  profile: Profile;
  availableFilms: CreatorFilmListItem[];
  availableTools: ToolOption[];
};

type FormState = {
  handle: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  website_url: string;
  is_creator: boolean;
  theatre_settings: CreatorTheatreSettings;
};

function isValidHandle(handle: string) {
  return /^[a-z0-9_]{3,32}$/.test(handle);
}

function formatFilmOptionLabel(film: CreatorFilmListItem) {
  const status = film.publishStatus === "published"
    ? "Published"
    : film.publishStatus === "archived"
      ? "Archived"
      : "Draft";
  return `${film.title} - ${status}`;
}

function getPublishBadgeClass(status: CreatorFilmListItem["publishStatus"]) {
  if (status === "published") {
    return "border-emerald-300/35 bg-emerald-300/10 text-emerald-100";
  }

  if (status === "archived") {
    return "border-amber-300/35 bg-amber-300/10 text-amber-100";
  }

  return "border-white/14 bg-white/5 text-foreground/78";
}

const presentationPresets = [
  {
    id: "signature",
    name: "Signature",
    description: "Balanced rhythm with clear identity and confident hierarchy.",
  },
  {
    id: "gallery",
    name: "Gallery",
    description: "Airier spacing and quieter framing with a calm editorial flow.",
  },
  {
    id: "monument",
    name: "Monument",
    description: "Denser composition with stronger featured-work emphasis.",
  },
] as const;

const STUDIO_MODULES_STORAGE_KEY = "arsneos-studio-modules-open-v1";

type StudioModuleKey = "identity" | "featured" | "library" | "story" | "share";

type StudioModuleOpenState = Record<StudioModuleKey, boolean>;

const defaultStudioModuleOpenState: StudioModuleOpenState = {
  identity: true,
  featured: false,
  library: false,
  story: false,
  share: false,
};

export function ProfileSettingsForm({ profile, availableFilms, availableTools }: ProfileSettingsFormProps) {
  const [form, setForm] = useState<FormState>({
    handle: profile.handle,
    display_name: profile.displayName,
    bio: profile.bio ?? "",
    avatar_url: profile.avatarUrl ?? "",
    banner_url: profile.bannerUrl ?? "",
    website_url: profile.websiteUrl ?? "",
    is_creator: profile.isCreator,
    theatre_settings: normalizeTheatreSettings(profile.theatreSettings ?? defaultTheatreSettings),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [moduleOpenState, setModuleOpenState] = useState<StudioModuleOpenState>(defaultStudioModuleOpenState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STUDIO_MODULES_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Partial<StudioModuleOpenState>;
      setModuleOpenState({
        identity: typeof parsed.identity === "boolean" ? parsed.identity : defaultStudioModuleOpenState.identity,
        featured: typeof parsed.featured === "boolean" ? parsed.featured : defaultStudioModuleOpenState.featured,
        library: typeof parsed.library === "boolean" ? parsed.library : defaultStudioModuleOpenState.library,
        story: typeof parsed.story === "boolean" ? parsed.story : defaultStudioModuleOpenState.story,
        share: typeof parsed.share === "boolean" ? parsed.share : defaultStudioModuleOpenState.share,
      });
    } catch {
      // Keep defaults if localStorage is unavailable or malformed.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STUDIO_MODULES_STORAGE_KEY, JSON.stringify(moduleOpenState));
    } catch {
      // Ignore storage failures; UI still works with in-memory state.
    }
  }, [moduleOpenState]);

  const uploadInFlight = isAvatarUploading || isBannerUploading;
  const openingStatementLength = form.theatre_settings.openingStatement?.length ?? 0;
  const creativeProcessSummaryLength = form.theatre_settings.creativeProcessSummary?.length ?? 0;
  const profileUrlPath = `/creator/${form.handle || profile.handle}`;

  const activeFeaturedFilm = useMemo(() => {
    if (form.theatre_settings.featuredMode === "latest") {
      return availableFilms.find((film) => film.publishStatus === "published") ?? availableFilms[0] ?? null;
    }

    if (!form.theatre_settings.featuredFilmId) {
      return null;
    }

    return availableFilms.find((film) => film.id === form.theatre_settings.featuredFilmId) ?? null;
  }, [availableFilms, form.theatre_settings.featuredFilmId, form.theatre_settings.featuredMode]);

  const orderedSections = useMemo(
    () => form.theatre_settings.sectionOrder
      .map((sectionId) => theatreSectionDefinitions.find((section) => section.id === sectionId))
      .filter(Boolean),
    [form.theatre_settings.sectionOrder],
  ) as typeof theatreSectionDefinitions;

  const orderedFilms = useMemo(() => {
    const ranked = new Map(form.theatre_settings.filmOrder.map((id, index) => [id, index]));
    return [...availableFilms].sort((a, b) => {
      const rankA = ranked.get(a.id);
      const rankB = ranked.get(b.id);
      if (typeof rankA === "number" && typeof rankB === "number") {
        return rankA - rankB;
      }
      if (typeof rankA === "number") {
        return -1;
      }
      if (typeof rankB === "number") {
        return 1;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [availableFilms, form.theatre_settings.filmOrder]);

  function updateTheatreSettings(updater: (current: CreatorTheatreSettings) => CreatorTheatreSettings) {
    setForm((current) => ({
      ...current,
      theatre_settings: normalizeTheatreSettings(updater(current.theatre_settings)),
    }));
  }

  function toggleSection(sectionId: TheatreSectionId) {
    updateTheatreSettings((current) => {
      const visible = new Set(current.visibleSections);

      if (visible.has(sectionId)) {
        visible.delete(sectionId);
      } else {
        visible.add(sectionId);
      }

      return {
        ...current,
        visibleSections: current.sectionOrder.filter((id) => visible.has(id)),
      };
    });
  }

  function moveSection(sectionId: TheatreSectionId, direction: -1 | 1) {
    updateTheatreSettings((current) => {
      const nextOrder = [...current.sectionOrder];
      const currentIndex = nextOrder.indexOf(sectionId);
      const nextIndex = currentIndex + direction;

      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= nextOrder.length) {
        return current;
      }

      const swapTarget = nextOrder[nextIndex];
      nextOrder[nextIndex] = sectionId;
      nextOrder[currentIndex] = swapTarget;

      return {
        ...current,
        sectionOrder: nextOrder,
      };
    });
  }

  function moveFilm(filmId: string, direction: -1 | 1) {
    updateTheatreSettings((current) => {
      const baseOrder = current.filmOrder.filter((id) => availableFilms.some((film) => film.id === id));
      if (!baseOrder.includes(filmId)) {
        baseOrder.push(filmId);
      }

      const currentIndex = baseOrder.indexOf(filmId);
      const nextIndex = currentIndex + direction;
      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= baseOrder.length) {
        return current;
      }

      const swap = baseOrder[nextIndex];
      baseOrder[nextIndex] = filmId;
      baseOrder[currentIndex] = swap;

      return {
        ...current,
        filmOrder: baseOrder,
      };
    });
  }

  function togglePreferredTool(slug: string) {
    updateTheatreSettings((current) => {
      const next = new Set(current.preferredToolSlugs);
      if (next.has(slug)) {
        next.delete(slug);
      } else if (next.size < MAX_TOOL_SELECTIONS) {
        next.add(slug);
      }

      return {
        ...current,
        preferredToolSlugs: normalizeToolSlugs([...next]),
      };
    });
  }

  async function copyProfileLink() {
    const href = `${window.location.origin}${profileUrlPath}`;
    await navigator.clipboard.writeText(href);
    setSuccess("Public link copied.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isValidHandle(form.handle)) {
      setError("Handle must be 3-32 characters and use lowercase letters, numbers, or underscores.");
      return;
    }

    if (!form.display_name.trim()) {
      setError("Display name is required.");
      return;
    }

    if (openingStatementLength > THEATRE_OPENING_STATEMENT_LIMIT) {
      setError(`Creator note must be ${THEATRE_OPENING_STATEMENT_LIMIT} characters or fewer.`);
      return;
    }

    if (creativeProcessSummaryLength > CREATIVE_PROCESS_SUMMARY_LIMIT) {
      setError(`Story and process summary must be ${CREATIVE_PROCESS_SUMMARY_LIMIT} characters or fewer.`);
      return;
    }

    if (uploadInFlight) {
      setError("Wait for image uploads to finish before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          handle: form.handle.trim().toLowerCase(),
          display_name: form.display_name.trim(),
          bio: form.bio.trim() || null,
          avatar_url: form.avatar_url || null,
          banner_url: form.banner_url || null,
          website_url: form.website_url.trim() || null,
          theatre_settings: normalizeTheatreSettings({
            ...form.theatre_settings,
            openingStatement: form.theatre_settings.openingStatement?.trim() || null,
            featuredLabel: form.theatre_settings.featuredLabel?.trim() || null,
            heroImageUrl: form.theatre_settings.heroImageUrl || null,
            featuredFilmId: form.theatre_settings.featuredFilmId || null,
            creativeProcessSummary: form.theatre_settings.creativeProcessSummary?.trim() || null,
            preferredToolSlugs: normalizeToolSlugs(form.theatre_settings.preferredToolSlugs),
          }),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Creator Studio changes could not be saved.");
        return;
      }

      setSuccess("Creator Studio updated.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="app-stack-shell surface-panel cinema-frame min-w-0 overflow-x-clip p-4 sm:p-8 lg:p-10" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2 sm:space-y-1">
          <p className="display-kicker">Creator Studio</p>
          <h1 className="headline-lg text-balance">Shape how your work is experienced</h1>
          <p className="body-sm max-w-3xl">
            Five focused modules help you define identity, control what appears first, manage your releases,
            add optional context, and preview before sharing.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-start sm:gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={profileUrlPath}>Preview Public Page</Link>
          </Button>
          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSaving || uploadInFlight}>
            {isSaving ? "Saving..." : uploadInFlight ? "Uploading..." : "Save Studio"}
          </Button>
        </div>
      </div>

      <div className="studio-modules mt-6 grid gap-4 sm:mt-8 sm:gap-5">
        <StudioModule
          moduleKey="identity"
          index="1"
          title="Identity"
          description="Minimal editorial identity: name, line, description, and optional visual lead."
          isOpen={moduleOpenState.identity}
          onToggle={(open) => setModuleOpenState((current) => ({ ...current, identity: open }))}
        >

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            <Field label="Handle">
              <input value={form.handle} onChange={(event) => setForm((current) => ({ ...current, handle: event.target.value.toLowerCase() }))} className={inputClassName} placeholder="yourhandle" />
            </Field>
            <Field label="Display name">
              <input value={form.display_name} onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))} className={inputClassName} placeholder="Your name" />
            </Field>
          </div>

          <Field label="Tagline / creator note" helperText="Short line shown near the top of your public page.">
            <div className="grid gap-2">
              <textarea
                value={form.theatre_settings.openingStatement ?? ""}
                onChange={(event) => updateTheatreSettings((current) => ({ ...current, openingStatement: event.target.value.slice(0, THEATRE_OPENING_STATEMENT_LIMIT) }))}
                className={cn(inputClassName, "min-h-24 py-3")}
                placeholder="A concise line that frames your work"
              />
              <p className="text-xs text-muted-foreground">{openingStatementLength}/{THEATRE_OPENING_STATEMENT_LIMIT}</p>
            </div>
          </Field>

          <Field label="Description">
            <textarea value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} className={cn(inputClassName, "min-h-28 py-3 sm:min-h-32")} placeholder="Short profile description" />
          </Field>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
            <Field label="Avatar">
              <ImageUploadField entityType="profile" field="avatar" value={form.avatar_url} onChange={(nextValue) => setForm((current) => ({ ...current, avatar_url: nextValue }))} onUploadingChange={setIsAvatarUploading} label="Avatar" aspectRatio="square" helperText="Public avatar for profile and credits." />
            </Field>
            <Field label="Banner">
              <ImageUploadField entityType="profile" field="banner" value={form.banner_url} onChange={(nextValue) => setForm((current) => ({ ...current, banner_url: nextValue }))} onUploadingChange={setIsBannerUploading} label="Banner" aspectRatio="banner" helperText="Main visual behind your identity." />
            </Field>
            <Field label="Optional hero visual">
              <input
                value={form.theatre_settings.heroImageUrl ?? ""}
                onChange={(event) => updateTheatreSettings((current) => ({ ...current, heroImageUrl: event.target.value.trim() || null }))}
                className={inputClassName}
                placeholder="https://..."
              />
            </Field>
          </div>
        </StudioModule>

        <StudioModule
          moduleKey="featured"
          index="2"
          title="Featured Work"
          description="Set manual spotlight or automatic latest release. Add optional context label."
          isOpen={moduleOpenState.featured}
          onToggle={(open) => setModuleOpenState((current) => ({ ...current, featured: open }))}
        >

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="grid gap-4">
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-foreground sm:items-center">
                <input
                  type="checkbox"
                  checked={form.theatre_settings.featuredMode === "latest"}
                  onChange={(event) => updateTheatreSettings((current) => ({ ...current, featuredMode: event.target.checked ? "latest" : "manual" }))}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))] sm:mt-0"
                />
                <span>Use automatic latest release mode</span>
              </label>

              <Field label="Manual featured release" helperText="Used when automatic latest mode is off.">
                <select
                  value={form.theatre_settings.featuredFilmId ?? ""}
                  onChange={(event) => updateTheatreSettings((current) => ({ ...current, featuredFilmId: event.target.value || null }))}
                  className={cn(inputClassName, selectClassName)}
                  disabled={form.theatre_settings.featuredMode === "latest"}
                >
                  <option value="">No featured release selected</option>
                  {availableFilms.map((film) => (
                    <option key={film.id} value={film.id}>{formatFilmOptionLabel(film)}</option>
                  ))}
                </select>
              </Field>

              <Field label="Featured label (optional)">
                <input
                  value={form.theatre_settings.featuredLabel ?? ""}
                  onChange={(event) => updateTheatreSettings((current) => ({ ...current, featuredLabel: event.target.value.slice(0, 80) }))}
                  className={inputClassName}
                  placeholder="Editor\'s pick, New spotlight, Featured release"
                />
              </Field>
            </div>

            <aside className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <p className="display-kicker text-foreground/80">Current highlight preview</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {form.theatre_settings.featuredMode === "latest" ? "Auto mode: latest published release" : "Manual mode"}
              </p>
              <p className="mt-3 text-foreground">{activeFeaturedFilm?.title ?? "No release selected yet"}</p>
              <p className="mt-2 text-sm text-muted-foreground">{form.theatre_settings.featuredLabel || "No custom label"}</p>
            </aside>
          </div>
        </StudioModule>

        <StudioModule
          moduleKey="library"
          index="3"
          title="Film Library"
          description="See publish state, visibility, order priority, and edit access at a glance."
          isOpen={moduleOpenState.library}
          onToggle={(open) => setModuleOpenState((current) => ({ ...current, library: open }))}
        >

          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
            <p className="display-kicker text-foreground/80">Section order (major page flow)</p>
            <p className="body-sm mt-2">Move sections to control how your public profile unfolds.</p>
            <div className="mt-4 grid gap-3">
              {orderedSections.map((section, index) => (
                <div key={section.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{section.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{section.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="ghost" className="h-10 px-4" disabled={index === 0} onClick={() => moveSection(section.id, -1)}>Move up</Button>
                    <Button type="button" variant="ghost" className="h-10 px-4" disabled={index === orderedSections.length - 1} onClick={() => moveSection(section.id, 1)}>Move down</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {availableFilms.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.04] px-4 py-4 text-sm text-muted-foreground">
                No releases yet. Create your first release from Upload.
              </div>
            ) : (
              orderedFilms.map((film, index) => (
                <article key={film.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{film.title}</p>
                      <p className="mt-1 break-all text-xs uppercase tracking-[0.12em] text-muted-foreground sm:tracking-[0.16em]">/{film.slug}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={cn("rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]", getPublishBadgeClass(film.publishStatus))}>{film.publishStatus}</span>
                      <span className="rounded-full border border-white/14 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-foreground/78">{film.visibility}</span>
                      {form.theatre_settings.featuredFilmId === film.id && form.theatre_settings.featuredMode === "manual" ? (
                        <span className="rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-primary">Featured</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button asChild variant="ghost" className="h-10 w-full sm:w-auto">
                      <Link href={`/upload?film=${film.id}`}>Quick Edit</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 w-full sm:w-auto"
                      onClick={() => updateTheatreSettings((current) => ({ ...current, featuredMode: "manual", featuredFilmId: film.id }))}
                    >
                      Set as Featured
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 w-full sm:w-auto"
                      disabled={index === 0}
                      onClick={() => moveFilm(film.id, -1)}
                    >
                      Move Up
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 w-full sm:w-auto"
                      disabled={index === orderedFilms.length - 1}
                      onClick={() => moveFilm(film.id, 1)}
                    >
                      Move Down
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>
        </StudioModule>

        <StudioModule
          moduleKey="story"
          index="4"
          title="Story and Process"
          description="Optional context around the work."
          isOpen={moduleOpenState.story}
          onToggle={(open) => setModuleOpenState((current) => ({ ...current, story: open }))}
        >
          <details className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5" open={false}>
            <summary className="cursor-pointer text-sm text-foreground">Open story and process fields</summary>
            <div className="mt-4 grid gap-5">
              <Field label="Creator note" helperText="Appears as optional supporting context on your public page.">
                <div className="grid gap-2">
                  <textarea
                    value={form.theatre_settings.creativeProcessSummary ?? ""}
                    onChange={(event) => updateTheatreSettings((current) => ({ ...current, creativeProcessSummary: event.target.value.slice(0, CREATIVE_PROCESS_SUMMARY_LIMIT) }))}
                    className={cn(inputClassName, "min-h-28 py-3")}
                    placeholder="Optional note about process, perspective, or inspiration"
                  />
                  <p className="text-xs text-muted-foreground">{creativeProcessSummaryLength}/{CREATIVE_PROCESS_SUMMARY_LIMIT}</p>
                </div>
              </Field>

              <Field label="Tools used" helperText={`Choose up to ${MAX_TOOL_SELECTIONS} tools.`}>
                <div className="flex flex-wrap gap-2.5 rounded-[22px] border border-white/10 bg-black/20 p-4">
                  {availableTools.map((tool) => {
                    const selected = form.theatre_settings.preferredToolSlugs.includes(tool.slug);
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => togglePreferredTool(tool.slug)}
                        className={cn(
                          "rounded-full border px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] transition",
                          selected
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-white/10 bg-black/20 text-foreground/82 hover:border-white/20 hover:text-foreground",
                        )}
                      >
                        {tool.name}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div className="grid gap-3">
                <p className="display-kicker text-foreground/80">Visibility by section</p>
                {theatreSectionDefinitions.map((section) => {
                  const checked = form.theatre_settings.visibleSections.includes(section.id);
                  return (
                    <label key={section.id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground">
                      <input type="checkbox" checked={checked} onChange={() => toggleSection(section.id)} className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" />
                      <span>
                        <span className="block text-foreground">{section.label}</span>
                        <span className="mt-1 block text-muted-foreground">{section.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </details>
        </StudioModule>

        <StudioModule
          moduleKey="share"
          index="5"
          title="Share and Preview"
          description="Preview your page, copy your link, and choose a presentation preset that keeps quality high."
          isOpen={moduleOpenState.share}
          onToggle={(open) => setModuleOpenState((current) => ({ ...current, share: open }))}
        >

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="display-kicker text-foreground/80">Presentation preset</p>
                <p className="body-sm mt-2">Presets adjust emphasis and spacing without exposing complex design controls.</p>
                <div className="mt-4 grid gap-2.5">
                  {presentationPresets.map((preset) => {
                    const selected = form.theatre_settings.presentationPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => updateTheatreSettings((current) => ({ ...current, presentationPreset: preset.id }))}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-left transition",
                          selected
                            ? "border-primary/45 bg-primary/10"
                            : "border-white/12 bg-black/20 hover:border-white/25",
                        )}
                      >
                        <p className="text-sm text-foreground">{preset.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{preset.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field label="Website / primary link">
                <input value={form.website_url} onChange={(event) => setForm((current) => ({ ...current, website_url: event.target.value }))} className={inputClassName} placeholder="https://..." />
              </Field>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-foreground sm:items-center">
                <input type="checkbox" checked={form.is_creator} onChange={(event) => setForm((current) => ({ ...current, is_creator: event.target.checked }))} className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))] sm:mt-0" />
                <span>Show me as a creator on ArsNeos</span>
              </label>
            </div>

            <aside className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <p className="display-kicker text-foreground/80">Public preview</p>
              <p className="mt-3 break-all text-sm uppercase tracking-[0.12em] text-muted-foreground sm:tracking-[0.16em]">{profileUrlPath}</p>
              <p className="body-sm mt-3">
                Share preview: {form.display_name || "Creator"}
                {form.theatre_settings.openingStatement ? ` - ${form.theatre_settings.openingStatement}` : " - Creator page on ArsNeos"}
              </p>
              <div className="mt-4 grid gap-2">
                <Button asChild size="lg" className="w-full">
                  <Link href={profileUrlPath}>Open Public Preview</Link>
                </Button>
                <Button type="button" variant="ghost" size="lg" className="w-full" onClick={() => void copyProfileLink()}>
                  Copy Public Link
                </Button>
              </div>
            </aside>
          </div>
        </StudioModule>

        {error ? <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
        {success ? <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">{success}</div> : null}
      </div>
    </form>
  );
}

function StudioModule({
  moduleKey,
  index,
  title,
  description,
  children,
  isOpen,
  onToggle,
}: {
  moduleKey: StudioModuleKey;
  index: string;
  title: string;
  description: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}) {
  return (
    <details
      className="studio-module rounded-[24px] border border-white/10 bg-black/20 p-4 sm:rounded-[26px] sm:p-6"
      open={isOpen}
      onToggle={(event) => {
        const target = event.currentTarget;
        onToggle(target.open);
      }}
      data-module={moduleKey}
    >
      <summary className="cursor-pointer list-none">
        <div className="space-y-2 sm:space-y-1">
          <p className="display-kicker text-foreground/80">{index}. {title}</p>
          <h2 className="headline-sm text-foreground">{title}</h2>
          <p className="body-sm">{description}</p>
        </div>
      </summary>
      <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5">{children}</div>
    </details>
  );
}

function Field({ label, helperText, children }: { label: string; helperText?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="display-kicker text-[0.68rem] text-foreground/85">{label}</span>
      {children}
      {helperText ? <span className="text-sm leading-6 text-muted-foreground">{helperText}</span> : null}
    </label>
  );
}

const inputClassName = "h-12 w-full rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]";
const selectClassName = "appearance-none pr-10";
