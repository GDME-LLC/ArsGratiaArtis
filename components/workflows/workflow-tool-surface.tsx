"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FolderOpen, RefreshCw, Save, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkflowAssetManager } from "@/components/workflows/workflow-asset-manager";
import { cn } from "@/lib/utils";
import type { WorkflowDraft, WorkflowDraftStatus } from "@/types";

type WorkflowToolSurfaceProps = {
  canPersist: boolean;
  isSignedIn: boolean;
  entryPoint?: "homepage" | "header" | "dashboard" | "direct";
  initialDraftId?: string | null;
};

type WorkflowDraftState = {
  title: string;
  concept: string;
  creativeDirection: string;
  selectedTools: string;
  workflowSteps: string;
  notes: string;
};

const starterDraft: WorkflowDraftState = {
  title: "",
  concept: "",
  creativeDirection: "",
  selectedTools: "",
  workflowSteps: "",
  notes: "",
};

function splitListInput(value: string) {
  return [...new Set(value.split(/\n|,/g).map((entry) => entry.trim()).filter(Boolean))].slice(0, 24);
}

function hydrateFormFromDraft(draft: WorkflowDraft): WorkflowDraftState {
  return {
    title: draft.title,
    concept: draft.concept ?? "",
    creativeDirection: draft.creativeDirection ?? "",
    selectedTools: draft.selectedTools.join(", "),
    workflowSteps: draft.workflowSteps.join("\n"),
    notes: draft.notes ?? "",
  };
}

export function WorkflowToolSurface({ canPersist, isSignedIn, entryPoint = "direct", initialDraftId = null }: WorkflowToolSurfaceProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<WorkflowDraftState>(starterDraft);
  const [status, setStatus] = useState<string | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<WorkflowDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const completion = useMemo(() => {
    const fields = [draft.title, draft.concept, draft.creativeDirection, draft.selectedTools, draft.workflowSteps, draft.notes];
    const done = fields.filter((value) => value.trim().length > 0).length;
    return Math.round((done / fields.length) * 100);
  }, [draft]);

  const persistencePrompt = "Become a Creator to save progress, create drafts, and build projects in your Studio.";

  useEffect(() => {
    if (!canPersist) {
      return;
    }

    let isMounted = true;

    async function loadDrafts() {
      setIsLoadingDrafts(true);
      try {
        const response = await fetch("/api/workflows", { cache: "no-store" });
        const payload = (await response.json()) as { error?: string; drafts?: WorkflowDraft[] };

        if (!response.ok || !payload.drafts) {
          if (isMounted) {
            setStatus(payload.error ?? "Workflow drafts could not be loaded.");
          }
          return;
        }

        if (!isMounted) {
          return;
        }

        setSavedDrafts(payload.drafts);

        if (initialDraftId) {
          const matched = payload.drafts.find((entry) => entry.id === initialDraftId) ?? null;
          if (matched) {
            setActiveDraftId(matched.id);
            setDraft(hydrateFormFromDraft(matched));
            return;
          }
        }

        if (payload.drafts.length > 0) {
          const latest = payload.drafts[0];
          setActiveDraftId(latest.id);
          setDraft(hydrateFormFromDraft(latest));
        }
      } catch {
        if (isMounted) {
          setStatus("Network error while loading workflow drafts.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingDrafts(false);
        }
      }
    }

    void loadDrafts();

    return () => {
      isMounted = false;
    };
  }, [canPersist, initialDraftId]);

  function handleLiteStart() {
    setStatus("Workflow draft started. You can explore the structure now and continue later after activating Creator mode.");
  }

  async function persistDraft(nextStatus: WorkflowDraftStatus = "draft") {
    if (!canPersist) {
      setStatus(persistencePrompt);
      return null;
    }

    const title = draft.title.trim();

    if (!title) {
      setStatus("Add a project title before saving this workflow draft.");
      return null;
    }

    setIsSaving(true);

    try {
      const payload = {
        title,
        concept: draft.concept.trim() || null,
        creative_direction: draft.creativeDirection.trim() || null,
        selected_tools: splitListInput(draft.selectedTools),
        workflow_steps: splitListInput(draft.workflowSteps),
        notes: draft.notes.trim() || null,
        status: nextStatus,
      };

      const endpoint = activeDraftId ? `/api/workflows/${activeDraftId}` : "/api/workflows";
      const method = activeDraftId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string; draft?: WorkflowDraft };

      if (!response.ok || !data.draft) {
        setStatus(data.error ?? "Workflow draft could not be saved.");
        return null;
      }

      setActiveDraftId(data.draft.id);
      setSavedDrafts((current) => {
        const next = [data.draft as WorkflowDraft, ...current.filter((entry) => entry.id !== data.draft?.id)];
        return next;
      });

      return data.draft;
    } catch {
      setStatus("Network error while saving workflow draft.");
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  function handlePersistAction(action: "save" | "draft" | "studio") {
    void (async () => {
      const saved = await persistDraft("draft");

      if (!saved) {
        return;
      }

      if (action === "save") {
        setStatus("Project progress saved. Continue later from your workflow draft history.");
        return;
      }

      if (action === "draft") {
        setStatus("Draft project saved. You can now start a project from this workflow seed.");
        return;
      }

      if (saved.status === "seeded" && saved.seededFilmId) {
        setStatus("This workflow draft is already seeded. Opening the existing project.");
        router.push(`/upload?film=${saved.seededFilmId}`);
        return;
      }

      setStatus("Workflow draft saved. Opening Start a Project with this seed.");
      router.push(`/upload?workflowDraft=${saved.id}`);
    })();
  }

  async function updateDraftStatus(draftId: string, nextStatus: WorkflowDraftStatus) {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/workflows/${draftId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = (await response.json()) as { error?: string; draft?: WorkflowDraft };

      if (!response.ok || !payload.draft) {
        setStatus(payload.error ?? "Workflow draft status could not be updated.");
        return;
      }

      setSavedDrafts((current) => current.map((entry) => (entry.id === payload.draft?.id ? payload.draft : entry)));

      if (activeDraftId === payload.draft.id) {
        setDraft(hydrateFormFromDraft(payload.draft));
      }

      setStatus(nextStatus === "archived" ? "Workflow draft archived." : "Workflow draft restored.");
    } catch {
      setStatus("Network error while updating workflow draft status.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSavedDraft(draftId: string) {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/workflows/${draftId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setStatus(payload.error ?? "Workflow draft could not be deleted.");
        return;
      }

      setSavedDrafts((current) => current.filter((entry) => entry.id !== draftId));

      if (activeDraftId === draftId) {
        handleStartNewDraft();
      }

      setStatus("Workflow draft deleted.");
    } catch {
      setStatus("Network error while deleting workflow draft.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleOpenSavedDraft(saved: WorkflowDraft) {
    setActiveDraftId(saved.id);
    setDraft(hydrateFormFromDraft(saved));
    setStatus(`Loaded workflow draft: ${saved.title}`);
    router.replace(`${entryPoint === "dashboard" ? "/workflows" : "/workflow-tool"}?draft=${saved.id}`);
  }

  function handleStartNewDraft() {
    setActiveDraftId(null);
    setDraft(starterDraft);
    setStatus("Started a new workflow draft.");
    router.replace(entryPoint === "dashboard" ? "/workflows" : "/workflow-tool");
  }

  return (
    <section className="container-shell pb-16 pt-8 sm:pb-20 sm:pt-10 lg:pt-12">
      <div className="surface-panel cinema-frame overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-start">
          <div>
            <p className="display-kicker">Workflow Tool</p>
            <h1 className="headline-xl mt-3 text-foreground">Begin the project before the release</h1>
            <p className="body-lg mt-4 max-w-3xl text-foreground/86">
              Workflow Tool is the creator entry layer of Creator Studio. Shape direction, structure ideas, and build a
              project seed that can move into Start a Project and later publication.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5 text-[11px] uppercase tracking-[0.16em] text-foreground/72">
              <span className="rounded-full border border-white/16 bg-black/35 px-3 py-1.5">Workflow Tool</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="rounded-full border border-white/16 bg-black/35 px-3 py-1.5">Saved Draft / Project</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="rounded-full border border-white/16 bg-black/35 px-3 py-1.5">Creator Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="rounded-full border border-white/16 bg-black/35 px-3 py-1.5">Start a Project</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="rounded-full border border-white/16 bg-black/35 px-3 py-1.5">Release / Publish</span>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Project title</span>
                <input
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Project title or working idea"
                  className="h-11 rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-foreground outline-none transition focus:border-white/34"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Concept / description</span>
                <input
                  value={draft.concept}
                  onChange={(event) => setDraft((current) => ({ ...current, concept: event.target.value }))}
                  placeholder="Core idea and short premise"
                  className="h-11 rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-foreground outline-none transition focus:border-white/34"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Creative direction</span>
                <input
                  value={draft.creativeDirection}
                  onChange={(event) => setDraft((current) => ({ ...current, creativeDirection: event.target.value }))}
                  placeholder="Tone, mood, style references"
                  className="h-11 rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-foreground outline-none transition focus:border-white/34"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Tools / resources</span>
                <input
                  value={draft.selectedTools}
                  onChange={(event) => setDraft((current) => ({ ...current, selectedTools: event.target.value }))}
                  placeholder="Models, software, references"
                  className="h-11 rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-foreground outline-none transition focus:border-white/34"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Workflow steps</span>
                <input
                  value={draft.workflowSteps}
                  onChange={(event) => setDraft((current) => ({ ...current, workflowSteps: event.target.value }))}
                  placeholder="Sequence, acts, shot plan"
                  className="h-11 rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-foreground outline-none transition focus:border-white/34"
                />
              </label>

              <label className="grid gap-2 sm:col-span-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Workflow notes</span>
                <textarea
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Additional notes for continuity and continue-later context"
                  className="min-h-24 rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-foreground outline-none transition focus:border-white/34"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                size="lg"
                className="w-full border border-white/44 bg-[linear-gradient(180deg,rgba(255,255,255,0.33),rgba(255,255,255,0.14))] text-black shadow-[0_14px_34px_rgba(0,0,0,0.54),inset_0_1px_0_rgba(255,255,255,0.64),inset_0_-1px_0_rgba(132,140,152,0.42)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.38),rgba(255,255,255,0.18))] sm:w-auto"
                onClick={handleLiteStart}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Start Workflow
              </Button>

              <Button type="button" variant="ghost" size="lg" className="w-full sm:w-auto" onClick={() => handlePersistAction("save")} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Progress"}
              </Button>

              <Button type="button" variant="ghost" size="lg" className="w-full sm:w-auto" onClick={() => handlePersistAction("draft")} disabled={isSaving}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Create Draft Project
              </Button>

              <Button type="button" variant="ghost" size="lg" className="w-full sm:w-auto" onClick={() => handlePersistAction("studio")} disabled={isSaving}>
                Send to Studio
              </Button>

              {canPersist ? (
                <Button type="button" variant="ghost" size="lg" className="w-full sm:w-auto" onClick={handleStartNewDraft}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  New Draft
                </Button>
              ) : null}
            </div>

            {status ? (
              <div
                className={cn(
                  "mt-4 rounded-2xl border px-4 py-3 text-sm",
                  canPersist ? "border-white/16 bg-black/30 text-foreground/88" : "border-primary/36 bg-primary/12 text-primary"
                )}
              >
                {status}
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            {canPersist && activeDraftId ? (
              <WorkflowAssetManager draftId={activeDraftId} />
            ) : null}

            {canPersist ? (
              <article className="rounded-[24px] border border-white/12 bg-black/30 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="display-kicker">Draft History</p>
                  {isLoadingDrafts ? <span className="text-xs text-muted-foreground">Loading...</span> : null}
                </div>

                {savedDrafts.length === 0 ? (
                  <p className="body-sm mt-3">No saved workflow drafts yet. Save progress to unlock continue-later history.</p>
                ) : (
                  <div className="mt-3 space-y-2.5">
                    {savedDrafts.map((saved) => (
                      <div key={saved.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <p className="text-sm font-medium text-foreground">{saved.title}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-foreground/68">
                          {saved.status} - updated {new Date(saved.updatedAt).toLocaleDateString()}
                          {saved.assetCount > 0 ? ` · ${saved.assetCount} asset${saved.assetCount !== 1 ? "s" : ""}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button type="button" size="default" variant="ghost" className="h-9 px-3" onClick={() => handleOpenSavedDraft(saved)}>
                            Continue Later
                          </Button>
                          {saved.status === "seeded" && saved.seededFilmId ? (
                            <Button asChild size="default" variant="ghost" className="h-9 px-3">
                              <Link href={`/upload?film=${saved.seededFilmId}`}>Open Seeded Project</Link>
                            </Button>
                          ) : (
                            <Button asChild size="default" variant="ghost" className="h-9 px-3" disabled={saved.status === "archived"}>
                              <Link href={`/upload?workflowDraft=${saved.id}`}>Start a Project</Link>
                            </Button>
                          )}
                          {saved.status === "archived" ? (
                            <Button type="button" size="default" variant="ghost" className="h-9 px-3" disabled={isSaving} onClick={() => updateDraftStatus(saved.id, "draft")}>
                              Unarchive
                            </Button>
                          ) : (
                            <Button type="button" size="default" variant="ghost" className="h-9 px-3" disabled={isSaving} onClick={() => updateDraftStatus(saved.id, "archived")}>
                              Archive
                            </Button>
                          )}
                          <Button type="button" size="default" variant="ghost" className="h-9 px-3" disabled={isSaving} onClick={() => deleteSavedDraft(saved.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ) : null}

            <article className="rounded-[24px] border border-white/12 bg-black/30 p-5">
              <p className="display-kicker">Creator Mode</p>
              <p className="title-md mt-3 text-foreground">{canPersist ? "Persistence is active" : "Public exploration mode"}</p>
              <p className="body-sm mt-3">
                {canPersist
                  ? "You can move this workflow into Creator Studio and continue with Start a Project."
                  : "You can explore Workflow Tool now. Save, draft, continue, and send-to-Studio actions activate after becoming a Creator."}
              </p>
              {!canPersist ? (
                <Button asChild size="lg" className="mt-4 w-full">
                  <Link href={isSignedIn ? "/settings" : "/signup"}>Become a Creator</Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" size="lg" className="mt-4 w-full">
                  <Link href="/dashboard">Open Creator Studio</Link>
                </Button>
              )}
            </article>

            <article className="rounded-[24px] border border-white/12 bg-black/30 p-5">
              <p className="display-kicker">Project Readiness</p>
              <p className="title-md mt-3 text-foreground">{completion}% complete</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-[linear-gradient(90deg,rgba(255,255,255,0.88),rgba(210,218,232,0.74))]" style={{ width: `${completion}%` }} />
              </div>
              <p className="body-sm mt-3">
                Completion reflects how much of the initial project framework is defined before moving into Creator Studio.
              </p>
            </article>

            <article className="rounded-[24px] border border-white/12 bg-black/30 p-5">
              <p className="display-kicker">Entry Source</p>
              <p className="body-sm mt-3 text-foreground/84">Opened from: {entryPoint}</p>
              <p className="body-sm mt-2">
                Workflow Tool remains public-facing for discovery, but it is part of the Creator Studio creation pipeline.
              </p>
            </article>
          </aside>
        </div>
      </div>
    </section>
  );
}
