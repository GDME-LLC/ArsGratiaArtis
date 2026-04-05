"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, FolderOpen, Save, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WorkflowToolSurfaceProps = {
  canPersist: boolean;
  isSignedIn: boolean;
  entryPoint?: "homepage" | "header" | "dashboard" | "direct";
};

type WorkflowDraftState = {
  projectName: string;
  creativeDirection: string;
  selectedTools: string;
  earlyStructure: string;
};

const starterDraft: WorkflowDraftState = {
  projectName: "",
  creativeDirection: "",
  selectedTools: "",
  earlyStructure: "",
};

export function WorkflowToolSurface({ canPersist, isSignedIn, entryPoint = "direct" }: WorkflowToolSurfaceProps) {
  const [draft, setDraft] = useState<WorkflowDraftState>(starterDraft);
  const [status, setStatus] = useState<string | null>(null);

  const completion = useMemo(() => {
    const fields = [draft.projectName, draft.creativeDirection, draft.selectedTools, draft.earlyStructure];
    const done = fields.filter((value) => value.trim().length > 0).length;
    return Math.round((done / fields.length) * 100);
  }, [draft]);

  const persistencePrompt = "Become a Creator to save progress, create drafts, and build projects in your Studio.";

  function handleLiteStart() {
    setStatus("Workflow draft started. You can explore the structure now and continue later after activating Creator mode.");
  }

  function handlePersistAction(action: "save" | "draft" | "studio") {
    if (!canPersist) {
      setStatus(persistencePrompt);
      return;
    }

    if (action === "save") {
      setStatus("Project progress saved. Continue building this draft in Creator Studio.");
      return;
    }

    if (action === "draft") {
      setStatus("Draft project created. It is ready to carry into Start a Project.");
      return;
    }

    setStatus("Project foundation prepared. Open Creator Studio to continue in Start a Project.");
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
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Project concept</span>
                <input
                  value={draft.projectName}
                  onChange={(event) => setDraft((current) => ({ ...current, projectName: event.target.value }))}
                  placeholder="Project title or working idea"
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
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Early structure</span>
                <input
                  value={draft.earlyStructure}
                  onChange={(event) => setDraft((current) => ({ ...current, earlyStructure: event.target.value }))}
                  placeholder="Sequence, acts, shot plan"
                  className="h-11 rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-foreground outline-none transition focus:border-white/34"
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

              <Button type="button" variant="ghost" size="lg" className="w-full sm:w-auto" onClick={() => handlePersistAction("save")}>
                <Save className="mr-2 h-4 w-4" />
                Save Progress
              </Button>

              <Button type="button" variant="ghost" size="lg" className="w-full sm:w-auto" onClick={() => handlePersistAction("draft")}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Create Draft Project
              </Button>

              <Button type="button" variant="ghost" size="lg" className="w-full sm:w-auto" onClick={() => handlePersistAction("studio")}>
                Send to Studio
              </Button>
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
