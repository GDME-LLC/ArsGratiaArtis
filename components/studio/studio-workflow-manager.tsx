"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getWorkflowGoalLabel } from "@/lib/constants/workflow-builder";
import { cn } from "@/lib/utils";
import type { CreatorFilmListItem, SavedWorkflow, WorkflowVisibilityScope } from "@/types";

type StudioWorkflowManagerProps = {
  workflows: SavedWorkflow[];
  availableFilms: CreatorFilmListItem[];
};

type WorkflowApiResponse = {
  workflow?: SavedWorkflow;
  error?: string;
};

const visibilityOptions: Array<{
  value: WorkflowVisibilityScope;
  label: string;
  description: string;
}> = [
  {
    value: "private",
    label: "Private",
    description: "Kept inside Creator Studio only.",
  },
  {
    value: "theatre",
    label: "Visible on Theatre",
    description: "Read-only on the public Theatre.",
  },
  {
    value: "film_page",
    label: "Visible on Film Page",
    description: "Read-only on one attached film page.",
  },
  {
    value: "theatre_and_film",
    label: "Theatre and Film Page",
    description: "Read-only on the Theatre and one attached film page.",
  },
];

function formatUpdatedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function requiresFilmAttachment(scope: WorkflowVisibilityScope) {
  return scope === "film_page" || scope === "theatre_and_film";
}

export function StudioWorkflowManager({ workflows, availableFilms }: StudioWorkflowManagerProps) {
  const [items, setItems] = useState(workflows);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handlePresentationSave(workflow: SavedWorkflow, updates: Partial<SavedWorkflow>) {
    const nextWorkflow: SavedWorkflow = {
      ...workflow,
      ...updates,
    };

    if (requiresFilmAttachment(nextWorkflow.visibilityScope) && !nextWorkflow.attachedFilmId) {
      setError("Choose one of your films before making a workflow visible on a film page.");
      return;
    }

    setSavingId(workflow.id);
    setError("");

    try {
      const response = await fetch("/api/workflows", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowId: workflow.id,
          title: nextWorkflow.title,
          description: nextWorkflow.description,
          goal: nextWorkflow.goal,
          constraints: nextWorkflow.constraints,
          currentTools: nextWorkflow.currentTools,
          steps: nextWorkflow.steps,
          visibilityScope: nextWorkflow.visibilityScope,
          attachedFilmId: nextWorkflow.attachedFilmId,
        }),
      });

      const payload = (await response.json()) as WorkflowApiResponse;

      if (!response.ok || !payload.workflow) {
        setError(payload.error ?? "Workflow presentation could not be updated.");
        return;
      }

      setItems((current) => current.map((item) => (item.id === payload.workflow?.id ? payload.workflow : item)));
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSavingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
        <p className="display-kicker">Creative Workflows</p>
        <p className="title-md mt-3 text-foreground">No saved workflows yet</p>
        <p className="body-sm mt-3">
          Build a workflow from Resources, then return here to decide whether it stays private, appears on your Theatre, or accompanies a film page.
        </p>
        <div className="mt-5">
          <Button asChild size="lg">
            <Link href="/resources/starter-workflow">Build your first workflow</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {items.map((workflow) => {
        const isSaving = savingId === workflow.id;

        return (
          <article key={workflow.id} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="display-kicker">{getWorkflowGoalLabel(workflow.goal)}</p>
                <h3 className="title-md mt-3 text-foreground">{workflow.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  {workflow.description || "Saved from the workflow builder and ready to continue inside Creator Studio."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{workflow.progressCount} of {workflow.totalSteps} steps complete</span>
                  <span>Updated {formatUpdatedDate(workflow.updatedAt)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Button asChild size="lg">
                  <Link href={`/workflows/${workflow.id}`}>Continue Workflow</Link>
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
              <label className="grid gap-2">
                <span className="display-kicker text-[0.68rem] text-foreground/85">Public visibility</span>
                <select
                  value={workflow.visibilityScope}
                  onChange={(event) => {
                    const nextScope = event.target.value as WorkflowVisibilityScope;
                    setItems((current) =>
                      current.map((item) =>
                        item.id === workflow.id
                          ? {
                              ...item,
                              visibilityScope: nextScope,
                              attachedFilmId: requiresFilmAttachment(nextScope) ? item.attachedFilmId : null,
                            }
                          : item,
                      ),
                    );
                  }}
                  className="h-12 w-full rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground outline-none transition focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
                >
                  {visibilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-muted-foreground">
                  {visibilityOptions.find((option) => option.value === workflow.visibilityScope)?.description}
                </span>
              </label>

              <label className="grid gap-2">
                <span className="display-kicker text-[0.68rem] text-foreground/85">Attach to film</span>
                <select
                  value={workflow.attachedFilmId ?? ""}
                  onChange={(event) => {
                    const nextFilmId = event.target.value || null;
                    setItems((current) => current.map((item) => (item.id === workflow.id ? { ...item, attachedFilmId: nextFilmId } : item)));
                  }}
                  className="h-12 w-full rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground outline-none transition focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
                >
                  <option value="">No film attached</option>
                  {availableFilms.map((film) => (
                    <option key={film.id} value={film.id}>
                      {film.title}
                    </option>
                  ))}
                </select>
                <span className={cn("text-sm", requiresFilmAttachment(workflow.visibilityScope) ? "text-foreground/90" : "text-muted-foreground")}>
                  {requiresFilmAttachment(workflow.visibilityScope)
                    ? "Required when this workflow is visible on a film page."
                    : "Optional until you decide to show the workflow on a film page."}
                </span>
              </label>

              <Button
                type="button"
                variant="ghost"
                size="lg"
                disabled={isSaving}
                onClick={() => void handlePresentationSave(workflow, {})}
              >
                {isSaving ? "Saving..." : "Save Presentation"}
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
