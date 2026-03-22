"use client";

import { useMemo, useState } from "react";

import { CreatorBadgeList } from "@/components/badges/creator-badge-list";
import { Button } from "@/components/ui/button";
import type { AdminBadgeCreatorRow, AdminBadgeRecord } from "@/types";

export function AdminCreatorBadgeManager({
  creators,
  badges,
  onSaved,
}: {
  creators: AdminBadgeCreatorRow[];
  badges: AdminBadgeRecord[];
  onSaved: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedBadgeByCreator, setSelectedBadgeByCreator] = useState<Record<string, string>>({});
  const [founderFields, setFounderFields] = useState<Record<string, {
    founderNumber: string;
    featured: boolean;
    notes: string;
    markInvited: boolean;
    markAccepted: boolean;
  }>>({});
  const [pendingId, setPendingId] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredCreators = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return creators;
    }

    return creators.filter((creator) =>
      creator.displayName.toLowerCase().includes(normalized) || creator.handle.toLowerCase().includes(normalized),
    );
  }, [creators, query]);

  function getFounderState(creatorId: string) {
    const current = founderFields[creatorId];
    if (current) {
      return current;
    }

    const creator = creators.find((item) => item.id === creatorId);
    const foundingAssignment = creator?.badges.find((assignment) => assignment.badge.slug === "founding-creator");
    const founding = foundingAssignment?.foundingCreator;

    return {
      founderNumber: founding?.founderNumber ? String(founding.founderNumber) : "",
      featured: founding?.featured ?? true,
      notes: founding?.notes ?? "",
      markInvited: Boolean(founding?.invitedAt),
      markAccepted: Boolean(founding?.acceptedAt),
    };
  }

  function setFounderState(creatorId: string, next: ReturnType<typeof getFounderState>) {
    setFounderFields((current) => ({ ...current, [creatorId]: next }));
  }

  async function assignBadge(creatorId: string) {
    const badgeId = selectedBadgeByCreator[creatorId];
    if (!badgeId) {
      return;
    }

    const badge = badges.find((item) => item.id === badgeId);
    const founderState = getFounderState(creatorId);
    setPendingId(creatorId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/badge-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: creatorId,
          badgeId,
          displayOrder: badge?.slug === "founding-creator" ? Number(founderState.founderNumber) || 0 : 0,
          foundingCreator: badge?.slug === "founding-creator"
            ? {
                founderNumber: Number(founderState.founderNumber) || null,
                featured: founderState.featured,
                notes: founderState.notes.trim() || null,
                markInvited: founderState.markInvited,
                markAccepted: founderState.markAccepted,
              }
            : null,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Badge assignment failed.");
        return;
      }
      setSuccess("Badge assigned.");
      onSaved();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPendingId(undefined);
    }
  }

  async function updateAssignment(assignmentId: string, creatorId: string, badgeSlug: string, displayOrder: number) {
    const founderState = getFounderState(creatorId);
    setPendingId(assignmentId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/badge-assignments/${assignmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayOrder,
          foundingCreator: badgeSlug === "founding-creator"
            ? {
                founderNumber: Number(founderState.founderNumber) || null,
                featured: founderState.featured,
                notes: founderState.notes.trim() || null,
                markInvited: founderState.markInvited,
                markAccepted: founderState.markAccepted,
              }
            : null,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Badge assignment could not be updated.");
        return;
      }
      setSuccess("Badge assignment updated.");
      onSaved();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPendingId(undefined);
    }
  }

  async function removeAssignment(assignmentId: string) {
    const confirmed = window.confirm("Remove this badge from the creator?");
    if (!confirmed) {
      return;
    }

    setPendingId(assignmentId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/badge-assignments/${assignmentId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Badge could not be removed.");
        return;
      }
      setSuccess("Badge removed.");
      onSaved();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPendingId(undefined);
    }
  }

  return (
    <section className="grid gap-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="display-kicker">Creator Assignments</p>
          <h2 className="headline-lg mt-3 text-foreground">Assign and order badges on creator pages</h2>
          <p className="body-sm mt-3 max-w-3xl">
            Search creators, assign curated distinctions, and set display order. Founding Creator keeps its protected roster metadata here.
          </p>
        </div>
        <label className="grid gap-2 text-sm text-muted-foreground lg:min-w-[280px]">
          <span className="display-kicker text-[0.65rem]">Search creators</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground"
            placeholder="Search by name or handle"
          />
        </label>
      </div>

      {error ? <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">{success}</div> : null}

      {filteredCreators.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-muted-foreground">
          No creators matched this search.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCreators.map((creator) => {
            const founderState = getFounderState(creator.id);
            const selectedBadgeId = selectedBadgeByCreator[creator.id] ?? "";
            const selectedBadge = badges.find((badge) => badge.id === selectedBadgeId) ?? null;

            return (
              <article key={creator.id} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 max-w-3xl">
                    <p className="display-kicker break-all">@{creator.handle}</p>
                    <h3 className="title-md mt-3 break-words text-foreground">{creator.displayName}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {creator.isPublic ? "Public Theatre live" : "Private profile"} / {creator.isCreator ? "Creator account" : "Viewer"}
                    </p>
                    <div className="mt-4">
                      <CreatorBadgeList badges={creator.badges.map((assignment) => ({
                        id: assignment.badge.id,
                        slug: assignment.badge.slug,
                        name: assignment.badge.name,
                        description: assignment.badge.description,
                        iconName: assignment.badge.iconName,
                        theme: assignment.badge.theme,
                        isSystem: assignment.badge.isSystem,
                        isActive: assignment.badge.isActive,
                        sortOrder: assignment.badge.sortOrder,
                        displayOrder: assignment.displayOrder,
                        assignedAt: assignment.assignedAt,
                        foundingCreator: assignment.foundingCreator,
                      }))} />
                    </div>
                  </div>

                  <div className="grid gap-3 lg:min-w-[320px]">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <select
                        value={selectedBadgeId}
                        onChange={(event) => setSelectedBadgeByCreator((current) => ({ ...current, [creator.id]: event.target.value }))}
                        className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground"
                      >
                        <option value="">Choose a badge to assign</option>
                        {badges.map((badge) => (
                          <option key={badge.id} value={badge.id}>{badge.name}</option>
                        ))}
                      </select>
                      <Button type="button" size="lg" onClick={() => assignBadge(creator.id)} disabled={!selectedBadgeId || pendingId === creator.id}>
                        {pendingId === creator.id ? "Assigning..." : "Assign Badge"}
                      </Button>
                    </div>

                    {selectedBadge?.slug === "founding-creator" ? (
                      <div className="grid gap-3 rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="grid gap-2 text-sm text-muted-foreground">
                            <span className="display-kicker text-[0.65rem]">Founder Number</span>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={founderState.founderNumber}
                              onChange={(event) => setFounderState(creator.id, { ...founderState, founderNumber: event.target.value })}
                              className="h-11 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground"
                            />
                          </label>
                          <label className="grid gap-2 text-sm text-muted-foreground">
                            <span className="display-kicker text-[0.65rem]">Featured On Homepage</span>
                            <input
                              type="checkbox"
                              checked={founderState.featured}
                              onChange={(event) => setFounderState(creator.id, { ...founderState, featured: event.target.checked })}
                              className="h-4 w-4 accent-[hsl(var(--primary))]"
                            />
                          </label>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="grid gap-2 text-sm text-muted-foreground">
                            <span className="display-kicker text-[0.65rem]">Invited</span>
                            <input
                              type="checkbox"
                              checked={founderState.markInvited}
                              onChange={(event) => setFounderState(creator.id, { ...founderState, markInvited: event.target.checked })}
                              className="h-4 w-4 accent-[hsl(var(--primary))]"
                            />
                          </label>
                          <label className="grid gap-2 text-sm text-muted-foreground">
                            <span className="display-kicker text-[0.65rem]">Accepted</span>
                            <input
                              type="checkbox"
                              checked={founderState.markAccepted}
                              onChange={(event) => setFounderState(creator.id, { ...founderState, markAccepted: event.target.checked })}
                              className="h-4 w-4 accent-[hsl(var(--primary))]"
                            />
                          </label>
                        </div>
                        <label className="grid gap-2 text-sm text-muted-foreground">
                          <span className="display-kicker text-[0.65rem]">Founder Notes</span>
                          <textarea
                            value={founderState.notes}
                            onChange={(event) => setFounderState(creator.id, { ...founderState, notes: event.target.value })}
                            className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground"
                          />
                        </label>
                      </div>
                    ) : null}
                  </div>
                </div>

                {creator.badges.length > 0 ? (
                  <div className="mt-5 grid gap-3">
                    {creator.badges.map((assignment, index) => (
                      <div key={assignment.id} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="title-md text-foreground">{assignment.badge.name}</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {assignment.badge.description || "No badge description provided."}
                            </p>
                            {assignment.badge.isSystem ? (
                              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-primary/80">System badge</p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="lg"
                              disabled={index === 0 || pendingId === assignment.id}
                              onClick={() => updateAssignment(assignment.id, creator.id, assignment.badge.slug, Math.max(0, assignment.displayOrder - 1))}
                            >
                              Move Up
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="lg"
                              disabled={pendingId === assignment.id}
                              onClick={() => updateAssignment(assignment.id, creator.id, assignment.badge.slug, assignment.displayOrder + 1)}
                            >
                              Move Down
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="lg"
                              disabled={pendingId === assignment.id}
                              onClick={() => removeAssignment(assignment.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[20px] border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-muted-foreground">
                    No badges assigned yet.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}


