"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { AdminBadgeRecord } from "@/types";

const badgeThemes = ["gold", "silver", "obsidian", "ember", "velvet", "signal"] as const;
const iconNames = ["laurel", "badge-check", "shield", "gem"] as const;

type BadgeFormValues = {
  slug: string;
  name: string;
  description: string;
  iconName: string;
  theme: string;
  isActive: boolean;
  sortOrder: string;
};

function toFormValues(badge?: AdminBadgeRecord | null): BadgeFormValues {
  return {
    slug: badge?.slug ?? "",
    name: badge?.name ?? "",
    description: badge?.description ?? "",
    iconName: badge?.iconName ?? "laurel",
    theme: badge?.theme ?? "gold",
    isActive: badge?.isActive ?? true,
    sortOrder: String(badge?.sortOrder ?? 0),
  };
}

export function AdminBadgeForm({
  badge,
  onSaved,
}: {
  badge?: AdminBadgeRecord | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<BadgeFormValues>(toFormValues(badge));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setForm(toFormValues(badge));
    setError("");
    setSuccess("");
  }, [badge]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(badge ? `/api/admin/badges/${badge.id}` : "/api/admin/badges", {
        method: badge ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: form.slug.trim().toLowerCase(),
          name: form.name.trim(),
          description: form.description.trim() || null,
          iconName: form.iconName,
          theme: form.theme,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder) || 0,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Badge changes could not be saved.");
        return;
      }

      setSuccess(badge ? "Badge updated." : "Badge created.");
      if (!badge) {
        setForm(toFormValues(null));
      }
      onSaved();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!badge || badge.isSystem || pending) {
      return;
    }

    const confirmed = window.confirm(`Delete badge "${badge.name}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setPending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/badges/${badge.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Badge could not be deleted.");
        return;
      }

      setSuccess("Badge deleted.");
      onSaved();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4 rounded-[24px] border border-white/10 bg-black/20 p-5" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="display-kicker">{badge ? "Edit Badge" : "Create Badge"}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {badge ? "Refine a badge definition used across the platform." : "Add a new curated distinction for creators."}
          </p>
        </div>
        {badge?.isSystem ? (
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            System Badge
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-muted-foreground">
          <span className="display-kicker text-[0.65rem]">Name</span>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground"
            placeholder="Founding Creator"
          />
        </label>
        <label className="grid gap-2 text-sm text-muted-foreground">
          <span className="display-kicker text-[0.65rem]">Slug</span>
          <input
            value={form.slug}
            onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
            className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground"
            placeholder="founding-creator"
            disabled={badge?.isSystem}
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm text-muted-foreground">
        <span className="display-kicker text-[0.65rem]">Description</span>
        <textarea
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground"
          placeholder="A curated distinction shown on public Theatre pages."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm text-muted-foreground">
          <span className="display-kicker text-[0.65rem]">Theme</span>
          <select
            value={form.theme}
            onChange={(event) => setForm((current) => ({ ...current, theme: event.target.value }))}
            className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground"
          >
            {badgeThemes.map((theme) => (
              <option key={theme} value={theme}>{theme}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-muted-foreground">
          <span className="display-kicker text-[0.65rem]">Icon</span>
          <select
            value={form.iconName}
            onChange={(event) => setForm((current) => ({ ...current, iconName: event.target.value }))}
            className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground"
          >
            {iconNames.map((icon) => (
              <option key={icon} value={icon}>{icon}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-muted-foreground">
          <span className="display-kicker text-[0.65rem]">Sort Order</span>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
            className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground"
          />
        </label>
        <label className="grid gap-2 text-sm text-muted-foreground">
          <span className="display-kicker text-[0.65rem]">Active</span>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            className="h-4 w-4 accent-[hsl(var(--primary))]"
          />
        </label>
      </div>

      {error ? <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">{success}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {badge?.assignedCount ? `${badge.assignedCount} creators currently carry this badge.` : "New badges can be assigned after creation."}
        </div>
        <div className="flex flex-wrap gap-3">
          {badge && !badge.isSystem ? (
            <Button type="button" variant="ghost" size="lg" onClick={handleDelete} disabled={pending}>
              Delete Badge
            </Button>
          ) : null}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Saving..." : badge ? "Save Badge" : "Create Badge"}
          </Button>
        </div>
      </div>
    </form>
  );
}
