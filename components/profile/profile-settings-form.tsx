"use client";

import { useMemo, useState } from "react";

import { ImageUploadField } from "@/components/shared/image-upload-field";
import { Button } from "@/components/ui/button";
import { theatreStylePresetOrder, theatreStylePresets } from "@/lib/constants/theatre-style-presets";
import {
  defaultTheatreSettings,
  normalizeTheatreSettings,
  theatreSectionDefinitions,
  THEATRE_OPENING_STATEMENT_LIMIT,
} from "@/lib/theatre";
import { cn } from "@/lib/utils";
import type { CreatorFilmListItem, CreatorTheatreSettings, Profile, TheatreSectionId } from "@/types";

type ProfileSettingsFormProps = {
  profile: Profile;
  availableFilms: CreatorFilmListItem[];
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

export function ProfileSettingsForm({ profile, availableFilms }: ProfileSettingsFormProps) {
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
          }),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Profile could not be saved.");
        return;
      }

      setSuccess("Profile and Theatre updated.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="surface-panel cinema-frame p-8 sm:p-10" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <p className="display-kicker">Settings</p>
        <h1 className="headline-lg">My Theatre</h1>
        <p className="body-sm">
          Shape the public atmosphere of your Theatre while keeping the ArsGratia language intact.
        </p>
      </div>

      <div className="mt-8 grid gap-8">
        <section className="grid gap-5">
          <div className="space-y-1">
            <p className="display-kicker text-foreground/80">Profile</p>
            <h2 className="title-md text-foreground">Public identity</h2>
            <p className="body-sm">Update the core profile elements that frame your Theatre.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Handle">
              <input
                value={form.handle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    handle: event.target.value.toLowerCase(),
                  }))
                }
                className={inputClassName}
                placeholder="yourhandle"
              />
            </Field>

            <Field label="Display name">
              <input
                value={form.display_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    display_name: event.target.value,
                  }))
                }
                className={inputClassName}
                placeholder="Your name"
              />
            </Field>
          </div>

          <Field label="Bio">
            <textarea
              value={form.bio}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bio: event.target.value,
                }))
              }
              className={cn(inputClassName, "min-h-32 py-3")}
              placeholder="Short profile bio"
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Avatar">
              <ImageUploadField
                entityType="profile"
                field="avatar"
                value={form.avatar_url}
                onChange={(nextValue) =>
                  setForm((current) => ({
                    ...current,
                    avatar_url: nextValue,
                  }))
                }
                onUploadingChange={setIsAvatarUploading}
                label="Creator avatar"
                aspectRatio="square"
                helperText="Shown on Theatre pages, film credits, and profile references across ArsGratia."
              />
            </Field>

            <Field label="Banner">
              <ImageUploadField
                entityType="profile"
                field="banner"
                value={form.banner_url}
                onChange={(nextValue) =>
                  setForm((current) => ({
                    ...current,
                    banner_url: nextValue,
                  }))
                }
                onUploadingChange={setIsBannerUploading}
                label="Creator banner"
                aspectRatio="banner"
                helperText="Used as the atmospheric backdrop for the public Theatre when no hero visual is selected."
              />
            </Field>
          </div>

          <Field label="Website URL">
            <input
              value={form.website_url}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  website_url: event.target.value,
                }))
              }
              className={inputClassName}
              placeholder="https://..."
            />
          </Field>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.is_creator}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  is_creator: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-[hsl(var(--primary))]"
            />
            <span>Show me as a creator on the platform</span>
          </label>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-black/20 p-6 sm:p-8">
          <div className="space-y-2">
            <p className="display-kicker text-foreground/80">Direct Your Theatre</p>
            <h2 className="headline-sm text-foreground">Theatre Presentation</h2>
            <p className="body-sm max-w-3xl">
              Guide the mood, sequencing, and emphasis of your public Theatre with a restrained, curated system.
            </p>
          </div>

          <div className="mt-8 grid gap-8">
            <div className="grid gap-4">
              <div className="space-y-1">
                <p className="display-kicker text-foreground/80">Theatre Style</p>
                <p className="body-sm">Choose a presentation mood that still feels unmistakably ArsGratia.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {theatreStylePresetOrder.map((presetId) => {
                  const preset = theatreStylePresets[presetId];
                  const selected = form.theatre_settings.stylePreset === presetId;

                  return (
                    <button
                      key={presetId}
                      type="button"
                      onClick={() => updateTheatreSettings((current) => ({ ...current, stylePreset: presetId }))}
                      className={cn(
                        "rounded-[24px] border p-4 text-left transition",
                        "bg-white/[0.035] hover:bg-white/[0.06]",
                        preset.panelClass,
                        selected ? "ring-1 ring-[hsl(var(--primary))]" : "border-white/10",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={cn("display-kicker text-[0.64rem]", preset.eyebrowClass)}>{preset.label}</p>
                          <p className="mt-3 text-sm text-foreground/92">{preset.description}</p>
                        </div>
                        <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", selected ? "bg-[hsl(var(--primary))]" : "bg-white/20")} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="grid gap-5">
                <Field
                  label="Hero Visual"
                  helperText="Set a screening-banner image at the top of your Theatre."
                >
                  <ImageUploadField
                    entityType="profile"
                    field="hero"
                    value={form.theatre_settings.heroImageUrl ?? ""}
                    onChange={(nextValue) =>
                      updateTheatreSettings((current) => ({
                        ...current,
                        heroImageUrl: nextValue || null,
                      }))
                    }
                    onUploadingChange={setIsHeroUploading}
                    label="Theatre hero visual"
                    aspectRatio="banner"
                    helperText="A wide hero image that sits above the Theatre title block."
                  />
                </Field>

                <Field
                  label="Opening Statement"
                  helperText="A short line to set the tone of your Theatre."
                >
                  <div className="grid gap-2">
                    <textarea
                      value={form.theatre_settings.openingStatement ?? ""}
                      onChange={(event) =>
                        updateTheatreSettings((current) => ({
                          ...current,
                          openingStatement: event.target.value.slice(0, THEATRE_OPENING_STATEMENT_LIMIT),
                        }))
                      }
                      className={cn(inputClassName, "min-h-24 py-3")}
                      placeholder="A precise line that introduces the space."
                    />
                    <p className="text-xs text-muted-foreground">
                      {openingStatementLength}/{THEATRE_OPENING_STATEMENT_LIMIT}
                    </p>
                  </div>
                </Field>
              </div>

              <div className="grid gap-5">
                <Field
                  label="Featured Work"
                  helperText="Choose a release to spotlight near the opening of your Theatre."
                >
                  <select
                    value={form.theatre_settings.featuredFilmId ?? ""}
                    onChange={(event) =>
                      updateTheatreSettings((current) => ({
                        ...current,
                        featuredFilmId: event.target.value || null,
                      }))
                    }
                    className={cn(inputClassName, selectClassName)}
                  >
                    <option value="">No featured work selected</option>
                    {availableFilms.map((film) => (
                      <option key={film.id} value={film.id}>
                        {formatFilmOptionLabel(film)}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="display-kicker text-foreground/80">Visible Sections</p>
                  <div className="mt-4 grid gap-3">
                    {theatreSectionDefinitions.map((section) => {
                      const checked = form.theatre_settings.visibleSections.includes(section.id);

                      return (
                        <label key={section.id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSection(section.id)}
                            className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
                          />
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
                  <div key={section.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <div>
                      <p className="text-sm text-foreground">{section.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 w-10 px-0"
                        disabled={index === 0}
                        onClick={() => moveSection(section.id, -1)}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 w-10 px-0"
                        disabled={index === orderedSections.length - 1}
                        onClick={() => moveSection(section.id, 1)}
                      >
                        ↓
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {success}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button type="submit" size="xl" disabled={isSaving || uploadInFlight}>
            {isSaving ? "Saving..." : uploadInFlight ? "Uploading..." : "Save My Theatre"}
          </Button>
          <p className="body-sm">
            Public URL: <span className="text-foreground">/creator/{form.handle || "yourhandle"}</span>
          </p>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  helperText,
  children,
}: {
  label: string;
  helperText?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="display-kicker text-[0.68rem] text-foreground/85">{label}</span>
      {children}
      {helperText ? <span className="text-sm text-muted-foreground">{helperText}</span> : null}
    </label>
  );
}

const inputClassName =
  "h-12 w-full rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]";

const selectClassName = "appearance-none pr-10";