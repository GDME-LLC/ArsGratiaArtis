"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FilmVideoUpload } from "@/components/films/film-video-upload";
import { ImageUploadField } from "@/components/shared/image-upload-field";
import { Button } from "@/components/ui/button";
import { FILM_PROCESS_SUMMARY_LIMIT, MAX_TOOL_SELECTIONS, normalizeProcessTags, processTagOptions } from "@/lib/constants/process";
import { FILM_CATEGORY_LABELS, FILM_CATEGORY_VALUES, type FilmCategory } from "@/lib/films/categories";
import { normalizeSlug } from "@/lib/films/slug";
import { cn } from "@/lib/utils";
import type { FilmEditorValues, ToolOption } from "@/types";

type FilmEditorFormProps = {
  initialFilm?: FilmEditorValues | null;
  availableTools: ToolOption[];
};

type FormState = {
  title: string;
  slug: string;
  synopsis: string;
  description: string;
  category: FilmCategory;
  poster_url: string;
  prompt_text: string;
  process_summary: string;
  process_notes: string;
  process_tags: string[];
  tool_ids: string[];
  prompt_visibility: "public" | "followers" | "private";
  visibility: "public" | "unlisted" | "private";
  publish_status: "draft" | "published";
};

export function FilmEditorForm({ initialFilm, availableTools }: FilmEditorFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    title: initialFilm?.title ?? "",
    slug: initialFilm?.slug ?? "",
    synopsis: initialFilm?.synopsis ?? "",
    description: initialFilm?.description ?? "",
    category: initialFilm?.category ?? "film",
    poster_url: initialFilm?.posterUrl ?? "",
    prompt_text: initialFilm?.promptText ?? "",
    process_summary: initialFilm?.processSummary ?? "",
    process_notes: initialFilm?.processNotes ?? "",
    process_tags: initialFilm?.processTags ?? [],
    tool_ids: initialFilm?.selectedToolIds ?? [],
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

  function toggleTool(toolId: string) {
    setForm((current) => {
      const next = new Set(current.tool_ids);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else if (next.size < MAX_TOOL_SELECTIONS) {
        next.add(toolId);
      }

      return {
        ...current,
        tool_ids: [...next],
      };
    });
  }

  function toggleProcessTag(tag: string) {
    setForm((current) => {
      const next = new Set(current.process_tags);
      if (next.has(tag)) {
        next.delete(tag);
      } else if (next.size < MAX_TOOL_SELECTIONS) {
        next.add(tag);
      }

      return {
        ...current,
        process_tags: normalizeProcessTags([...next]),
      };
    });
  }

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

    if (form.process_summary.trim().length > FILM_PROCESS_SUMMARY_LIMIT) {
      setError(`Process summary must be ${FILM_PROCESS_SUMMARY_LIMIT} characters or fewer.`);
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
          process_summary: form.process_summary.trim() || null,
          process_notes: form.process_notes.trim() || null,
          process_tags: normalizeProcessTags(form.process_tags),
          tool_ids: form.tool_ids,
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
    <form className="app-stack-shell grid gap-3.5 sm:gap-5" onSubmit={handleSubmit}>
      <section className="app-stack-card rounded-[24px] border border-white/10 bg-white/[0.04] p-3.5 sm:rounded-[26px] sm:p-5 lg:p-6">
        <div className="max-w-2xl">
          <p className="display-kicker">Release Identity</p>
          <h2 className="title-lg mt-3 text-foreground">Build the page before the delivery</h2>
          <p className="body-sm mt-3 text-muted-foreground">
            Keep the first pass editorial and calm. Give the release its title, structure, and visual presence before you think about upload.
          </p>
        </div>

        <div className="mt-4 grid gap-3.5 sm:mt-6 sm:gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)] lg:gap-5">
          <div className="app-grid-safe grid gap-4">
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

            <div className="app-grid-safe grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
              <Field label="Slug" helperText="Public route name for the release.">
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
            </div>

            <Field label="Synopsis" helperText="A short line for listings and previews.">
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

            <Field label="Description" helperText="Longer context for the release page.">
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className={cn(inputClassName, "min-h-40 py-3")}
                placeholder="Longer note about the film, release, or context"
              />
            </Field>
          </div>

          <aside className="app-stack-card rounded-[22px] border border-white/10 bg-black/20 p-3.5 sm:rounded-[24px] sm:p-5">
            <p className="display-kicker">Release Route</p>
            <p className="mt-3 break-all text-sm uppercase tracking-[0.18em] text-muted-foreground sm:tracking-[0.22em]">
              /film/{normalizeSlug(form.slug || form.title || "your-film")}
            </p>
            <div className="mt-5 grid gap-3 text-sm text-muted-foreground">
              <p>Start with language and structure.</p>
              <p>Add presentation details once the release reads clearly.</p>
              <p>Attach video last, after the page already feels complete.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="app-stack-card rounded-[24px] border border-white/10 bg-white/[0.04] p-3.5 sm:rounded-[26px] sm:p-5 lg:p-6">
        <div className="max-w-2xl">
          <p className="display-kicker">Presentation</p>
          <h2 className="title-lg mt-3 text-foreground">Shape the surface with restraint</h2>
          <p className="body-sm mt-3 text-muted-foreground">
            Poster, credits, and process should support the work rather than turning the release into a dashboard.
          </p>
        </div>

        <div className="mt-4 grid gap-3.5 sm:mt-6 sm:gap-4 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)] lg:gap-5">
          <div className="app-grid-safe grid gap-4">
            <Field label="Poster image" helperText="Optional. A custom poster overrides the automatic thumbnail.">
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

            <Field label="Tools Used" helperText={`Choose up to ${MAX_TOOL_SELECTIONS} tools to credit on the release page.`}>
              <div className="flex flex-wrap gap-2.5 rounded-[22px] border border-white/10 bg-black/20 p-4">
                {availableTools.map((tool) => {
                  const selected = form.tool_ids.includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => toggleTool(tool.id)}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] transition",
                        selected
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-white/10 bg-white/5 text-foreground/82 hover:border-white/20 hover:text-foreground",
                      )}
                    >
                      {tool.name}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Process Tags" helperText={`Choose up to ${MAX_TOOL_SELECTIONS} tags to frame the process succinctly.`}>
              <div className="flex flex-wrap gap-2.5 rounded-[22px] border border-white/10 bg-black/20 p-4">
                {processTagOptions.map((tag) => {
                  const selected = form.process_tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleProcessTag(tag)}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] transition",
                        selected
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-white/10 bg-white/5 text-foreground/82 hover:border-white/20 hover:text-foreground",
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>

          <div className="app-grid-safe grid gap-4">
            <Field label="Process Summary" helperText="A short summary of how the piece was made.">
              <div className="grid gap-2">
                <textarea
                  value={form.process_summary}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      process_summary: event.target.value.slice(0, FILM_PROCESS_SUMMARY_LIMIT),
                    }))
                  }
                  className={cn(inputClassName, "min-h-28 py-3")}
                  placeholder="A concise note on production method, key tools, or the making approach."
                />
                <p className="text-xs text-muted-foreground">{form.process_summary.length}/{FILM_PROCESS_SUMMARY_LIMIT}</p>
              </div>
            </Field>

            <Field label="Production Notes" helperText="Optional deeper notes for viewers who want more process context.">
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

            <Field label="Prompt" helperText="Optional prompt text, brief, or excerpt.">
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
          </div>
        </div>
      </section>

      <section className="app-stack-card rounded-[24px] border border-white/10 bg-white/[0.04] p-3.5 sm:rounded-[26px] sm:p-5 lg:p-6">
        <div className="max-w-2xl">
          <p className="display-kicker">Release Settings</p>
          <h2 className="title-lg mt-3 text-foreground">Decide how the release appears</h2>
          <p className="body-sm mt-3 text-muted-foreground">
            Save privately while composing. Publish only when the page and the rights are both in order.
          </p>
        </div>

        <div className="mt-4 grid gap-3.5 sm:mt-6 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Prompt visibility" helperText="Who can read the prompt or brief.">
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

          <Field label="Visibility" helperText="How discoverable the release is.">
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

          <Field
            label="Publish status"
            helperText="Keep it as draft until the release is ready to stand on its own."
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

        <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-3.5 sm:mt-6 sm:p-5">
          <p className="display-kicker">Creator Responsibility</p>
          <p className="body-sm mt-3 text-muted-foreground">
            ArsNeos does not pre-approve every upload. Creators are responsible for publishing only work they have the legal right to release and for avoiding unlawful or abusive material.
          </p>
          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-foreground">
            <input
              type="checkbox"
              checked={creatorAcknowledged}
              onChange={(event) => setCreatorAcknowledged(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
            />
            <span>
              I confirm that I have the rights to publish this release on ArsNeos and that, to the best of my knowledge, it does not violate applicable law or the rights of others.
            </span>
          </label>
          <p className="mt-3 text-sm text-muted-foreground">
            {isPublishing
              ? "This acknowledgment is required before a release can be published."
              : "You can continue building in draft. This acknowledgment becomes required only when you publish."}
          </p>
        </div>
      </section>

      <section className="app-stack-card rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-3.5 sm:rounded-[26px] sm:p-5 lg:p-6">
        <div className="max-w-2xl">
          <p className="display-kicker">Final Delivery</p>
          <h2 className="title-lg mt-3 text-foreground">Attach the final cut last</h2>
          <p className="body-sm mt-3 text-muted-foreground">
            Once the page is already shaped, save the draft and then upload the video. That keeps the process deliberate instead of feeling like a generic SaaS intake form.
          </p>
        </div>

        <div className="mt-5 sm:mt-6">
          <FilmVideoUpload filmId={initialFilm?.id} initialMuxPlaybackId={initialFilm?.muxPlaybackId ?? null} />
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="app-stack-card flex flex-col gap-3 rounded-[22px] border border-white/10 bg-black/20 p-3.5 sm:rounded-[24px] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="display-kicker">Save</p>
          <p className="body-sm mt-2 text-muted-foreground">{initialFilm?.id ? "Update the current release draft." : "Create the draft first, then return here to upload the final cut."}</p>
        </div>
        <Button type="submit" size="xl" className="w-full sm:w-auto" disabled={isSaving || isPosterUploading}>
          {submitLabel}
        </Button>
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
    <label className="grid gap-2.5">
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