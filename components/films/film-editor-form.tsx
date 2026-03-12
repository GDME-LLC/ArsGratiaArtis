"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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
  poster_url: string;
  visibility: "public" | "unlisted" | "private";
  publish_status: "draft" | "published" | "archived";
};

export function FilmEditorForm({ initialFilm }: FilmEditorFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    title: initialFilm?.title ?? "",
    slug: initialFilm?.slug ?? "",
    synopsis: initialFilm?.synopsis ?? "",
    description: initialFilm?.description ?? "",
    poster_url: initialFilm?.posterUrl ?? "",
    visibility: initialFilm?.visibility ?? "private",
    publish_status: initialFilm?.publishStatus ?? "draft",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const submitLabel = isSaving
    ? "Saving..."
    : initialFilm?.id
      ? "Save Film"
      : "Create Draft";

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
          poster_url: form.poster_url.trim() || null,
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
    <form className="surface-panel cinema-frame p-8 sm:p-10" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <p className="display-kicker">Film Draft</p>
        <h1 className="headline-lg">
          {initialFilm?.id ? "Edit your draft film" : "Create a new film draft"}
        </h1>
        <p className="body-sm">
          Set the core film metadata now. Video upload and streaming come later.
        </p>
      </div>

      <div className="mt-8 grid gap-5">
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
            placeholder="Film title"
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
            placeholder="Short synopsis"
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
            placeholder="Longer description"
          />
        </Field>

        <Field label="Poster URL">
          <input
            value={form.poster_url}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                poster_url: event.target.value,
              }))
            }
            className={inputClassName}
            placeholder="https://..."
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Visibility">
            <select
              value={form.visibility}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  visibility: event.target.value as FormState["visibility"],
                }))
              }
              className={inputClassName}
            >
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </select>
          </Field>

          <Field label="Publish status">
            <select
              value={form.publish_status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  publish_status: event.target.value as FormState["publish_status"],
                }))
              }
              className={inputClassName}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>

        {error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" size="xl" disabled={isSaving}>
            {submitLabel}
          </Button>
          <p className="body-sm self-center">
            Public route target:{" "}
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
  "h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-white/[0.07]";
