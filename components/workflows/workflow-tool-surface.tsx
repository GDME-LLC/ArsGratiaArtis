"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, RefreshCw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SeededDraftPanel } from "@/components/workflows/seeded-draft-panel";
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
  const [activeSurface, setActiveSurface] = useState<"idle" | "start" | "import">("idle");
  const [draft, setDraft] = useState<WorkflowDraftState>(starterDraft);
  const [status, setStatus] = useState<string | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<WorkflowDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const activeDraft = useMemo(() => savedDrafts.find((d) => d.id === activeDraftId) ?? null, [savedDrafts, activeDraftId]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasDraftInProgress = canPersist && savedDrafts.some((entry) => entry.status !== "archived");

  const persistencePrompt = "Become a Creator to save progress, create drafts, and continue from your dashboard.";

  const directConnectTools = ["Runway", "ElevenLabs", "Google Drive", "Luma Dream Machine"];
  const importFriendlyTools = [
    "DaVinci Resolve",
    "Adobe Premiere Pro",
    "After Effects",
    "Midjourney",
    "Kling",
    "Pika",
    "Topaz",
    "Suno",
    "Udio",
    "ChatGPT",
    "Claude",
    "Notion",
    "Dropbox",
  ];

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
            setActiveSurface("import");
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

  function openStartProject() {
    setActiveSurface("start");
    setStatus("Start with a title, idea, and format. You can save and continue at any time.");
  }

  function openImportProject() {
    setActiveSurface("import");
    setStatus("Import an active project using integrations, uploads, exports, and links.");
  }

  function openConnectTools() {
    setActiveSurface("import");
    setStatus("Connect tools to import assets and keep project work in sync.");
  }

  function openUploadExports() {
    setActiveSurface("import");
    setStatus("Upload exports and source files from any tool you already use.");
  }

  function openAddProjectLink() {
    setActiveSurface("import");
    setStatus("Add project links so collaborators and references stay in one place.");
  }

  function connectProvider(provider: string) {
    setActiveSurface("import");
    setStatus(`Connecting ${provider}... Import actions will appear here after account link.`);
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

  function handlePersistAction(action: "save" | "studio") {
    void (async () => {
      const saved = await persistDraft("draft");

      if (!saved) {
        return;
      }

      if (action === "save") {
        setStatus("Project progress saved. Continue later from your workflow draft history.");
        return;
      }

      if (saved.status === "seeded" && saved.seededFilmId) {
        setStatus("This workflow draft is already seeded. Opening the existing project.");
        router.push(`/upload?film=${saved.seededFilmId}`);
        return;
      }

      setStatus("Project saved. Opening upload and editing with this draft.");
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
    setActiveSurface("import");
    setDraft(hydrateFormFromDraft(saved));
    setStatus(`Loaded workflow draft: ${saved.title}`);
    router.replace(`${entryPoint === "dashboard" ? "/workflows" : "/workflow-tool"}?draft=${saved.id}`);
  }

  function handleStartNewDraft() {
    setActiveDraftId(null);
    setDraft(starterDraft);
    setActiveSurface("idle");
    setStatus("Started a new workflow draft.");
    router.replace(entryPoint === "dashboard" ? "/workflows" : "/workflow-tool");
  }

  return (
    <section className="container-shell pb-14 pt-6 sm:pb-20 sm:pt-10 lg:pt-12">
      <div className="surface-panel cinema-frame overflow-hidden p-4 sm:p-6 lg:p-8">
        <div>
          <p className="display-kicker">Project Builder</p>
          <h1 className="headline-xl mt-3 text-foreground">Bring your project together</h1>
          <p className="body-lg mt-4 max-w-3xl text-foreground/86">
            Start a project, connect your tools, add exports and links, and move toward release from one place.
          </p>

          <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap">
            <Button type="button" size="lg" className="w-full sm:w-auto" onClick={openStartProject}>
              Start a Project
            </Button>
            <Button type="button" size="lg" variant="ghost" className="w-full sm:w-auto" onClick={openConnectTools}>
              Connect Tools
            </Button>
            <Button type="button" size="lg" variant="ghost" className="w-full sm:w-auto" onClick={openUploadExports}>
              Upload Exports
            </Button>
            <Button type="button" size="lg" variant="ghost" className="w-full sm:w-auto" onClick={openAddProjectLink}>
              Add Project Link
            </Button>
            {hasDraftInProgress ? (
              <Button
                type="button"
                size="lg"
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => {
                  const latest = savedDrafts.find((entry) => entry.status !== "archived");
                  if (latest) {
                    handleOpenSavedDraft(latest);
                  } else {
                    openImportProject();
                  }
                }}
              >
                Continue Draft
              </Button>
            ) : null}
          </div>

          {activeSurface === "idle" && hasDraftInProgress ? (
            <article className="mt-6 rounded-[24px] border border-white/12 bg-black/24 p-5">
              <p className="display-kicker">Draft in progress</p>
              <p className="body-sm mt-2 text-foreground/84">Continue where you left off or move your draft into upload and release editing.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    const latest = savedDrafts.find((entry) => entry.status !== "archived");
                    if (latest) {
                      handleOpenSavedDraft(latest);
                    } else {
                      openImportProject();
                    }
                  }}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Continue Draft
                </Button>
                <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
                  <Link href="/dashboard">Open in Dashboard</Link>
                </Button>
              </div>
            </article>
          ) : null}

          {activeSurface === "start" ? (
            <article className="mt-6 rounded-[24px] border border-white/12 bg-black/28 p-5 sm:p-6">
              <p className="display-kicker">Guided start</p>
              <p className="body-sm mt-2 text-foreground/82">Create a project draft from scratch. No connected accounts required.</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Working title</span>
                  <input
                    value={draft.title}
                    onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Working title for your film"
                    className="h-11 rounded-2xl border border-white/14 bg-black/30 px-4 text-sm text-foreground outline-none transition focus:border-white/36"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Project idea</span>
                  <input
                    value={draft.concept}
                    onChange={(event) => setDraft((current) => ({ ...current, concept: event.target.value }))}
                    placeholder="Core idea and story premise"
                    className="h-11 rounded-2xl border border-white/14 bg-black/30 px-4 text-sm text-foreground outline-none transition focus:border-white/36"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Type or format</span>
                  <input
                    value={draft.creativeDirection}
                    onChange={(event) => setDraft((current) => ({ ...current, creativeDirection: event.target.value }))}
                    placeholder="Short film, episodic, trailer, proof of concept"
                    className="h-11 rounded-2xl border border-white/14 bg-black/30 px-4 text-sm text-foreground outline-none transition focus:border-white/36"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Intended tools (optional)</span>
                  <input
                    value={draft.selectedTools}
                    onChange={(event) => setDraft((current) => ({ ...current, selectedTools: event.target.value }))}
                    placeholder="Runway, ElevenLabs, Midjourney, Notion"
                    className="h-11 rounded-2xl border border-white/14 bg-black/30 px-4 text-sm text-foreground outline-none transition focus:border-white/36"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button type="button" size="lg" className="w-full sm:w-auto" onClick={() => handlePersistAction("save")} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Progress"}
                </Button>
                <Button asChild type="button" variant="ghost" size="lg" className="w-full sm:w-auto">
                  <Link href="/dashboard">Open in Dashboard</Link>
                </Button>
                <Button type="button" variant="ghost" size="lg" className="w-full sm:w-auto" onClick={() => setActiveSurface("idle")}>
                  Back
                </Button>
              </div>
            </article>
          ) : null}

          {activeSurface === "import" ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
              <div className="space-y-4">
                <article className="rounded-[24px] border border-white/12 bg-black/28 p-5 sm:p-6">
                  <p className="display-kicker">Import existing work</p>
                  <p className="body-sm mt-2 text-foreground/82">
                    Connect available integrations and organize external work using uploads, exports, and links.
                  </p>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Connect directly</p>
                      <div className="mt-2 flex flex-wrap gap-2.5">
                        {directConnectTools.map((tool) => (
                          <Button
                            key={tool}
                            type="button"
                            variant="ghost"
                            className="h-9 border-white/16 px-3 transition hover:border-white/26"
                            onClick={() => connectProvider(tool)}
                          >
                            Connect {tool}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Add via exports, uploads, or links</p>
                      <p className="mt-2 text-sm leading-6 text-foreground/72">
                        {importFriendlyTools.join(" • ")}
                      </p>
                    </div>
                  </div>

                  <p className="body-sm mt-4 text-foreground/70">
                    Direct connections are live integrations. Other tools are supported through exported files, manual uploads, and project links.
                  </p>
                </article>

                <article className="rounded-[24px] border border-white/12 bg-black/28 p-5 sm:p-6">
                  <p className="display-kicker">Project intake</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Project title</span>
                      <input
                        value={draft.title}
                        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Name of your active project"
                        className="h-11 rounded-2xl border border-white/14 bg-black/30 px-4 text-sm text-foreground outline-none transition focus:border-white/36"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Current summary</span>
                      <input
                        value={draft.concept}
                        onChange={(event) => setDraft((current) => ({ ...current, concept: event.target.value }))}
                        placeholder="What exists already and what is next"
                        className="h-11 rounded-2xl border border-white/14 bg-black/30 px-4 text-sm text-foreground outline-none transition focus:border-white/36"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Connected tools / sources</span>
                      <input
                        value={draft.selectedTools}
                        onChange={(event) => setDraft((current) => ({ ...current, selectedTools: event.target.value }))}
                        placeholder="Runway, Drive, exports, shared folders"
                        className="h-11 rounded-2xl border border-white/14 bg-black/30 px-4 text-sm text-foreground outline-none transition focus:border-white/36"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Materials by stage</span>
                      <input
                        value={draft.workflowSteps}
                        onChange={(event) => setDraft((current) => ({ ...current, workflowSteps: event.target.value }))}
                        placeholder="Scripts, rough cuts, sound design, finals"
                        className="h-11 rounded-2xl border border-white/14 bg-black/30 px-4 text-sm text-foreground outline-none transition focus:border-white/36"
                      />
                    </label>

                    <label className="grid gap-2 sm:col-span-2">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Project links and notes</span>
                      <textarea
                        value={draft.notes}
                        onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                        placeholder="Paste project links, export locations, and context for collaborators"
                        className="min-h-24 rounded-2xl border border-white/14 bg-black/30 px-4 py-3 text-sm text-foreground outline-none transition focus:border-white/36"
                      />
                    </label>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button type="button" size="lg" className="w-full sm:w-auto" onClick={() => handlePersistAction("save")} disabled={isSaving}>
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? "Saving..." : "Save Progress"}
                    </Button>
                    <Button asChild type="button" variant="ghost" size="lg" className="w-full sm:w-auto">
                      <Link href="/dashboard">Open in Dashboard</Link>
                    </Button>
                    <Button type="button" variant="ghost" size="lg" className="w-full sm:w-auto" onClick={() => setActiveSurface("idle")}>
                      Back
                    </Button>
                    {canPersist ? (
                      <Button type="button" variant="ghost" size="lg" className="w-full sm:w-auto" onClick={handleStartNewDraft}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        New Draft
                      </Button>
                    ) : null}
                  </div>
                </article>
              </div>

              <aside className="space-y-4">
                {canPersist && activeDraft?.status === "seeded" ? <SeededDraftPanel draft={activeDraft} /> : null}
                {canPersist && activeDraftId ? <WorkflowAssetManager draftId={activeDraftId} /> : null}

                {canPersist ? (
                  <article className="rounded-[24px] border border-white/12 bg-black/30 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="display-kicker">Draft History</p>
                      {isLoadingDrafts ? <span className="text-xs text-muted-foreground">Loading...</span> : null}
                    </div>

                    {savedDrafts.length === 0 ? (
                      <p className="body-sm mt-3">No saved project drafts yet.</p>
                    ) : (
                      <div className="mt-3 space-y-2.5">
                        {savedDrafts.map((saved) => (
                          <div key={saved.id} className="rounded-xl border border-white/10 bg-black/25 p-3 transition hover:border-white/20">
                            <p className="text-sm font-medium text-foreground">{saved.title}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-foreground/68">
                              {saved.status} - updated {new Date(saved.updatedAt).toLocaleDateString()}
                              {saved.assetCount > 0 ? ` · ${saved.assetCount} asset${saved.assetCount !== 1 ? "s" : ""}` : ""}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Button type="button" size="default" variant="ghost" className="h-9 px-3" onClick={() => handleOpenSavedDraft(saved)}>
                                Continue Draft
                              </Button>
                              {saved.status === "seeded" && saved.seededFilmId ? (
                                <Button asChild size="default" variant="ghost" className="h-9 px-3">
                                  <Link href={`/upload?film=${saved.seededFilmId}`}>Open Seeded Release</Link>
                                </Button>
                              ) : (
                                <Button asChild size="default" variant="ghost" className="h-9 px-3" disabled={saved.status === "archived"}>
                                  <Link href={`/upload?workflowDraft=${saved.id}`}>Open Draft</Link>
                                </Button>
                              )}
                              {saved.status === "archived" ? (
                                <Button
                                  type="button"
                                  size="default"
                                  variant="ghost"
                                  className="h-9 px-3"
                                  disabled={isSaving}
                                  onClick={() => updateDraftStatus(saved.id, "draft")}
                                >
                                  Unarchive
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="default"
                                  variant="ghost"
                                  className="h-9 px-3"
                                  disabled={isSaving}
                                  onClick={() => updateDraftStatus(saved.id, "archived")}
                                >
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
              </aside>
            </div>
          ) : null}

          {activeSurface !== "import" ? (
            <article className="mt-6 rounded-[24px] border border-white/12 bg-black/24 p-5">
              <p className="display-kicker">Dashboard Access</p>
              <p className="title-md mt-3 text-foreground">{canPersist ? "Save and continue is active" : "Sign in to save and continue"}</p>
              <p className="body-sm mt-3">
                {canPersist
                  ? "Your drafts, assets, and project handoff are available in your Dashboard hub."
                  : "You can plan freely now. Saving drafts, asset organization, and continue-later unlock after enabling Creator access."}
              </p>
              {!canPersist ? (
                <Button asChild size="lg" className="mt-4 w-full sm:w-auto">
                  <Link href={isSignedIn ? "/settings" : "/signup"}>Become a Creator</Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" size="lg" className="mt-4 w-full sm:w-auto">
                  <Link href="/dashboard">Open Dashboard</Link>
                </Button>
              )}
              {activeSurface !== "idle" ? <p className="body-sm mt-3 text-foreground/62">Opened from: {entryPoint}</p> : null}
            </article>
          ) : null}

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
      </div>
    </section>
  );
}
