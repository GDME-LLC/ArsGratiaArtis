"use client";

import { useState } from "react";

import { ImageUploadField } from "@/components/shared/image-upload-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

type ProfileSettingsFormProps = {
  profile: Profile;
};

type FormState = {
  handle: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  website_url: string;
  is_creator: boolean;
};

function isValidHandle(handle: string) {
  return /^[a-z0-9_]{3,32}$/.test(handle);
}

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const [form, setForm] = useState<FormState>({
    handle: profile.handle,
    display_name: profile.displayName,
    bio: profile.bio ?? "",
    avatar_url: profile.avatarUrl ?? "",
    banner_url: profile.bannerUrl ?? "",
    website_url: profile.websiteUrl ?? "",
    is_creator: profile.isCreator,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    if (isAvatarUploading || isBannerUploading) {
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
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Profile could not be saved.");
        return;
      }

      setSuccess("Profile updated.");
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
        <h1 className="headline-lg">Edit your creator profile</h1>
        <p className="body-sm">
          Update the public identity viewers will see across ArsGratia.
        </p>
      </div>

      <div className="mt-8 grid gap-5">
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
              helperText="Shown on creator pages, film credits, and profile references across ArsGratia."
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
              helperText="Used as the cinematic backdrop for the public creator page."
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

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" size="xl" disabled={isSaving || isAvatarUploading || isBannerUploading}>
            {isSaving ? "Saving..." : isAvatarUploading || isBannerUploading ? "Uploading..." : "Save Profile"}
          </Button>
          <p className="body-sm self-center">
            Public URL: <span className="text-foreground">/creator/{form.handle || "yourhandle"}</span>
          </p>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="display-kicker text-[0.68rem] text-foreground/85">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "h-12 w-full rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]";
