"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

const studioSections = [
  { id: "identity", label: "Identity" },
  { id: "featured", label: "Featured Work" },
  { id: "releases", label: "Releases" },
  { id: "links", label: "Links" },
  { id: "stack", label: "Creative Stack" },
  { id: "settings", label: "Creator Studio Settings" },
] as const;

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
  const [isHeroUploading, setIsHeroUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const uploadInFlight = isAvatarUploading || isBannerUploading || isHeroUploading;
  const openingStatementLength = form.theatre_settings.openingStatement?.length ?? 0;
  const creativeProcessSummaryLength = form.theatre_settings.creativeProcessSummary?.length ?? 0;
  const orderedSections = useMemo(
    () => form.theatre_settings.sectionOrder.map((sectionId) => theatreSectionDefinitions.find((section) => section.id === sectionId)).filter(Boolean),
    [form.theatre_settings.sectionOrder],
  ) as typeof theatreSectionDefinitions;

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
      setError(`Opening Statement must be ${THEATRE_OPENING_STATEMENT_LIMIT} characters or fewer.`);
      return;
    }

    if (creativeProcessSummaryLength > CREATIVE_PROCESS_SUMMARY_LIMIT) {
      setError(`Creative Stack summary must be ${CREATIVE_PROCESS_SUMMARY_LIMIT} characters or fewer.`);
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
    <form className="surface-panel cinema-frame p-4 sm:p-8 lg:p-10" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2 sm:space-y-1">
          <p className="display-kicker">Creator Studio</p>
          <h1 className="headline-lg text-balance">Your Creator Studio</h1>
          <p className="body-sm max-w-3xl">
            Manage your identity, featured work, releases, links, and creative stack. Your public Studio page is part of your Creator Studio.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-start sm:gap-3">
          <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
            <Link href={`/creator/${form.handle || profile.handle}`}>View Public Studio</Link>
          </Button>
          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSaving || uploadInFlight}>
            {isSaving ? "Saving..." : uploadInFlight ? "Uploading..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Section navigation removed for clarity and tighter UI */}

      <div className="mt-5 grid gap-5 sm:mt-8 sm:gap-8">
        <section id="identity" className="grid gap-4 rounded-[28px] border border-white/10 bg-black/20 p-4 sm:gap-5 sm:p-8">
          <div className="space-y-2 sm:space-y-1">
            <p className="display-kicker text-foreground/80">Identity</p>
            <h2 className="headline-sm text-foreground">Your public identity and essentials</h2>
            <p className="body-sm">These details appear on your public Studio page and across your work.</p>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            <Field label="Handle">
              <input value={form.handle} onChange={(event) => setForm((current) => ({ ...current, handle: event.target.value.toLowerCase() }))} className={inputClassName} placeholder="yourhandle" />
            </Field>
            <Field label="Display name">
              <input value={form.display_name} onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))} className={inputClassName} placeholder="Your name" />
            </Field>
          </div>

          <Field label="Bio">
            <textarea value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} className={cn(inputClassName, "min-h-28 py-3 sm:min-h-32")} placeholder="Short profile bio" />
          </Field>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            <Field label="Avatar">
              <ImageUploadField entityType="profile" field="avatar" value={form.avatar_url} onChange={(nextValue) => setForm((current) => ({ ...current, avatar_url: nextValue }))} onUploadingChange={setIsAvatarUploading} label="Avatar" aspectRatio="square" helperText="This is your public avatar for your Studio and credits." />
            </Field>
            <Field label="Banner">
              <ImageUploadField entityType="profile" field="banner" value={form.banner_url} onChange={(nextValue) => setForm((current) => ({ ...current, banner_url: nextValue }))} onUploadingChange={setIsBannerUploading} label="Banner" aspectRatio="banner" helperText="This is the main banner for your Studio page." />
            </Field>
          </div>

          <Field label="Website URL">
            <input value={form.website_url} onChange={(event) => setForm((current) => ({ ...current, website_url: event.target.value }))} className={inputClassName} placeholder="https://..." />
          </Field>

          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-foreground sm:items-center">
            <input type="checkbox" checked={form.is_creator} onChange={(event) => setForm((current) => ({ ...current, is_creator: event.target.checked }))} className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))] sm:mt-0" />
            <span>Show me as a creator on ArsGratia</span>
          </label>
        </section>

        <section id="following" className="grid gap-4 rounded-[28px] border border-white/10 bg-black/20 p-4 sm:gap-5 sm:p-8">
          <div className="space-y-2 sm:space-y-1">
            <p className="display-kicker text-foreground/80">Following</p>
            <h2 className="headline-sm text-foreground">Followed creators will live here</h2>
            <p className="body-sm max-w-3xl">
              This section is reserved for following creators and, in the future, deciding what appears on your public Studio page.
            </p>
          </div>
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-muted-foreground sm:p-5">
            Following management is coming soon. Public following will be opt-in and part of your Creator Studio.
          </div>
        </section>

        <section id="settings" className="rounded-[28px] border border-white/10 bg-black/20 p-4 sm:p-8">
          <div className="space-y-2">
            <p className="display-kicker text-foreground/80">Creator Studio Settings</p>
            <h2 className="headline-sm text-foreground">Configure your public Studio page</h2>
            <p className="body-sm max-w-3xl">
              These controls affect your public Studio page, its visible sections, and creative stack.
            </p>
          </div>

          <div className="mt-5 grid gap-5 sm:mt-8 sm:gap-8">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="grid gap-5">
                <Field label="Studio Intro" helperText="A short line to set the tone of your Studio.">
                  <div className="grid gap-2">
                    <textarea value={form.theatre_settings.openingStatement ?? ""} onChange={(event) => updateTheatreSettings((current) => ({ ...current, openingStatement: event.target.value.slice(0, THEATRE_OPENING_STATEMENT_LIMIT) }))} className={cn(inputClassName, "min-h-24 py-3")} placeholder="A precise line that introduces your Studio." />
                    <p className="text-xs text-muted-foreground">{openingStatementLength}/{THEATRE_OPENING_STATEMENT_LIMIT}</p>
                  </div>
                </Field>

                <Field label="Practice / Methods" helperText="A short note on how you typically approach the work.">
                  <div className="grid gap-2">
                    <textarea value={form.theatre_settings.creativeProcessSummary ?? ""} onChange={(event) => updateTheatreSettings((current) => ({ ...current, creativeProcessSummary: event.target.value.slice(0, CREATIVE_PROCESS_SUMMARY_LIMIT) }))} className={cn(inputClassName, "min-h-28 py-3")} placeholder="A concise summary of your creative process, methods, or production approach." />
                    <p className="text-xs text-muted-foreground">{creativeProcessSummaryLength}/{CREATIVE_PROCESS_SUMMARY_LIMIT}</p>
                  </div>
                </Field>
              </div>

              <div className="grid gap-5">
                <Field label="Featured Work" helperText="Choose a release to spotlight near the opening of your Studio.">
                  <select value={form.theatre_settings.featuredFilmId ?? ""} onChange={(event) => updateTheatreSettings((current) => ({ ...current, featuredFilmId: event.target.value || null }))} className={cn(inputClassName, selectClassName)}>
                    <option value="">No featured work selected</option>
                    {availableFilms.map((film) => (
                      <option key={film.id} value={film.id}>{formatFilmOptionLabel(film)}</option>
                    ))}
                  </select>
                </Field>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                  <p className="display-kicker text-foreground/80">Creative Stack</p>
                  <p className="body-sm mt-2">Choose up to {MAX_TOOL_SELECTIONS} preferred tools to display publicly on your Studio.</p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
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
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                  <p className="display-kicker text-foreground/80">Visible Sections</p>
                  <div className="mt-4 grid gap-3">
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
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <p className="display-kicker text-foreground/80">Section Order</p>
              <p className="body-sm mt-2">Set the sequence for the visible sections of your Theatre.</p>
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
          </div>
        </section>

        {error ? <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
        {success ? <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">{success}</div> : null}

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <Button type="submit" size="xl" className="w-full sm:w-auto" disabled={isSaving || uploadInFlight}>
            {isSaving ? "Saving..." : uploadInFlight ? "Uploading..." : "Save Studio Changes"}
          </Button>
          <p className="body-sm break-all sm:break-normal">Public Theatre URL: <span className="text-foreground">/creator/{form.handle || "yourhandle"}</span></p>
        </div>
      </div>
    </form>
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
