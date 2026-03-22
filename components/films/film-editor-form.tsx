"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FilmVideoUpload } from "@/components/films/film-video-upload";
import { ImageUploadField } from "@/components/shared/image-upload-field";
import { Button } from "@/components/ui/button";
import { FILM_CATEGORY_LABELS, FILM_CATEGORY_VALUES, type FilmCategory } from "@/lib/films/categories";
import { normalizeSlug } from "@/lib/films/slug";
import { cn } from "@/lib/utils";
import type { FilmEditorValues } from "@/types";

type FilmEditorFormProps = {
  initialFilm?: FilmEditorValues | null;
};

type FormState = {
  title: string;
  slug: string;
  synopsis: string;
  description: string;
  category: FilmCategory;
  poster_url: string;
  prompt_text: string;
  process_notes: string;
  prompt_visibility: "public" | "followers" | "private";
  visibility: "public" | "unlisted" | "private";
  publish_status: "draft" | "published";
};

export function FilmEditorForm({ initialFilm }: FilmEditorFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    title: initialFilm?.title ?? "",
    slug: initialFilm?.slug ?? "",
    synopsis: initialFilm?.synopsis ?? "",
    description: initialFilm?.description ?? "",
    category: initialFilm?.category ?? "film",
    poster_url: initialFilm?.posterUrl ?? "",
    prompt_text: initialFilm?.promptText ?? "",
    process_notes: initialFilm?.processNotes ?? "",
    prompt_visibility: initialFilm?.promptVisibility ?? "private",
    visibility: initialFilm?.visibility ?? "private",
    publish_status: initialFilm?.publishStatus === "published" ? "published" : "draft",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPosterUploading, setIsPosterUploading] = useState(false);
  const [error, setError] = useState("");
  const [creatorAcknowledged, setCreatorAcknowledged] = useState(initialFilm?.publishStatus === "published");
  const submitLabel = isSaving
    ? "Saving..."
    : isPosterUploading
      ? "Uploading Poster..."
    : initialFilm?.id
      ? "Save Release"
      : "Create Draft Release";
  const isPublishing = form.publish_status === "published";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const title = form.title.trim();
    const slug = normalizeSlug(form.slug || title);

    if (!title) {
      setError("Title is required.");
      return;
    }

    if (!slug) {
      setError("Slug is required.");
      return;
    }

    if (isPublishing && !creatorAcknowledged) {
      setError("Confirm creator responsibility before publishing this release.");
      return;
    }

    if (isPosterUploading) {
      setError("Wait for the poster upload to finish before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/films", {
        method: initialFilm?.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: initialFilm?.id,
          title,
          slug,
          synopsis: form.synopsis.trim() || null,
          description: form.description.trim() || null,
          category: form.category,
          poster_url: form.poster_url || null,
          prompt_text: form.prompt_text.trim() || null,
          process_notes: form.process_notes.trim() || null,
          prompt_visibility: form.prompt_visibility,
          visibility: form.visibility,
          publish_status: form.publish_status,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Film could not be saved.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="surface-panel cinema-frame p-6 sm:p-8" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <p className="display-kicker">Film Draft</p>
        <h1 className="headline-lg">
          {initialFilm?.id ? "Edit your draft release" : "Create a new draft release"}
        </h1>
        <p className="body-sm">
          Set the core release details now. Poster-led film pages are supported, and video can be attached later.
        </p>
      </div>

      <div className="mt-6 rounded-[22px] border border-white/10 bg-white/5 p-5">
        <p className="display-kicker">Publishing Notes</p>
        <p className="body-sm mt-3">
          A strong poster, title, synopsis, and public slug are enough to open the page well. Add video when the cut is ready to screen.
        </p>
      </div>

      <div className="mt-8 grid gap-5">
        <FilmVideoUpload
          filmId={initialFilm?.id}
          initialMuxPlaybackId={initialFilm?.muxPlaybackId ?? null}
        />

        <Field label="Title">
          <input
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                title: event.target.value,
                slug: current.slug ? current.slug : normalizeSlug(event.target.value),
              }))
            }
            className={inputClassName}
            placeholder="Title of the film"
          />
        </Field>

        <Field label="Slug">
          <input
            value={form.slug}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                slug: normalizeSlug(event.target.value),
              }))
            }
            className={inputClassName}
            placeholder="film-title"
          />
        </Field>

        <Field label="Synopsis">
          <textarea
            value={form.synopsis}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                synopsis: event.target.value,
              }))
            }
            className={cn(inputClassName, "min-h-24 py-3")}
            placeholder="Short line for the public page"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            className={cn(inputClassName, "min-h-36 py-3")}
            placeholder="Longer note about the film, release, or context"
          />
        </Field>

        <Field label="Category">
          <select
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value as FilmCategory,
              }))
            }
            className={selectClassName}
          >
            {FILM_CATEGORY_VALUES.map((category) => (
              <option className={selectOptionClassName} key={category} value={category}>
                {FILM_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Poster image">
          <ImageUploadField
            entityType="film"
            field="poster"
            filmId={initialFilm?.id}
            value={form.poster_url}
            onChange={(nextValue) =>
              setForm((current) => ({
                ...current,
                poster_url: nextValue,
              }))
            }
            onUploadingChange={setIsPosterUploading}
            label="Film poster"
            aspectRatio="poster"
            helperText="Upload a custom poster to override the automatic thumbnail generated from the video."
          />
        </Field>

        <Field label="Prompt">
          <textarea
            value={form.prompt_text}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                prompt_text: event.target.value,
              }))
            }
            className={cn(inputClassName, "min-h-32 py-3")}
            placeholder="Optional prompt text, creative brief, or excerpt"
          />
        </Field>

        <Field label="Process Notes">
          <textarea
            value={form.process_notes}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                process_notes: event.target.value,
              }))
            }
            className={cn(inputClassName, "min-h-32 py-3")}
            placeholder="Optional notes on process, iteration, tools, or production approach"
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Prompt visibility"
            helperText="Control who can read the prompt or brief on the public film page."
          >
            <select
              value={form.prompt_visibility}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  prompt_visibility: event.target.value as FormState["prompt_visibility"],
                }))
              }
              className={selectClassName}
            >
              <option className={selectOptionClassName} value="private">Private</option>
              <option className={selectOptionClassName} value="followers">Followers</option>
              <option className={selectOptionClassName} value="public">Public</option>
            </select>
          </Field>

          <Field label="Visibility">
            <select
              value={form.visibility}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  visibility: event.target.value as FormState["visibility"],
                }))
              }
              className={selectClassName}
            >
              <option className={selectOptionClassName} value="private">Private</option>
              <option className={selectOptionClassName} value="unlisted">Unlisted</option>
              <option className={selectOptionClassName} value="public">Public</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Publish status"
            helperText="Use Draft while you're building the page. Published makes the release eligible to go live; internal active review states stay out of the creator UI."
          >
            <select
              value={form.publish_status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  publish_status: event.target.value as FormState["publish_status"],
                }))
              }
              className={selectClassName}
            >
              <option className={selectOptionClassName} value="draft">Draft</option>
              <option className={selectOptionClassName} value="published">Published</option>
            </select>
          </Field>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-black/20 p-5">
          <p className="display-kicker">Creator Responsibility</p>
          <p className="body-sm mt-3 text-muted-foreground">
            ArsGratia does not pre-approve every upload. Creators are responsible for publishing only work they have the legal right to release and for avoiding unlawful or abusive material.
          </p>
          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-foreground">
            <input
              type="checkbox"
              checked={creatorAcknowledged}
              onChange={(event) => setCreatorAcknowledged(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
            />
            <span>
              I confirm that I have the rights to publish this release on ArsGratia and that, to the best of my knowledge, it does not violate applicable law or the rights of others.
            </span>
          </label>
          {isPublishing ? (
            <p className="mt-3 text-sm text-muted-foreground">
              This acknowledgment is required before a release can be published.
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              You can keep drafting without publishing yet. This acknowledgment becomes relevant when the release is moved to published.
            </p>
          )}
        </div>

        {error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" size="xl" disabled={isSaving || isPosterUploading}>
            {submitLabel}
          </Button>
          <p className="body-sm self-center">
            Public route:{" "}
            <span className="text-foreground">
              /film/{normalizeSlug(form.slug || form.title || "your-film")}
            </span>
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
      {helperText ? <p className="text-sm text-muted-foreground">{helperText}</p> : null}
    </label>
  );
}

const inputClassName =
  "h-12 w-full rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]";

const selectClassName =
  "h-12 w-full rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition focus:border-primary/60 focus:bg-[hsl(var(--surface-3))] focus:text-foreground [color-scheme:dark] [&>option]:bg-[#11141c] [&>option]:text-[#f4eee4]";

const selectOptionClassName = "bg-[#11141c] text-[#f4eee4]";


