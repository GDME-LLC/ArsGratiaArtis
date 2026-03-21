"use client";

import { Button } from "@/components/ui/button";
import { ToolRecommendationList } from "@/components/workflows/tool-recommendation-list";
import { cn } from "@/lib/utils";
import type { WorkflowStepDraft, WorkflowStepStatus } from "@/types";

type WorkflowStepCardProps = {
  step: WorkflowStepDraft;
  editable?: boolean;
  onStatusChange?: (status: WorkflowStepStatus) => void;
  onNotesChange?: (notes: string) => void;
};

const statusLabels: Record<WorkflowStepStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  complete: "Complete",
};

export function WorkflowStepCard({ step, editable = false, onStatusChange, onNotesChange }: WorkflowStepCardProps) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary">
              {step.stepNumber}
            </div>
            <div>
              <p className="display-kicker">Step {step.stepNumber}</p>
              <h3 className="title-md mt-2 text-foreground">{step.title}</h3>
            </div>
            <span className={cn("inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em]", step.status === "complete" ? "border-primary/30 bg-primary/10 text-primary" : step.status === "in_progress" ? "border-white/20 bg-white/[0.08] text-foreground" : "border-white/10 bg-black/20 text-muted-foreground")}>
              {statusLabels[step.status]}
            </span>
          </div>
          <p className="body-sm mt-4">{step.description}</p>
          <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
            <p className="display-kicker">Why it matters</p>
            <p className="mt-2 text-sm text-foreground/92">{step.whyItMatters}</p>
          </div>
        </div>

        {editable ? (
          <div className="flex flex-wrap gap-2 lg:w-[220px] lg:justify-end">
            <Button type="button" variant="ghost" className="h-10 px-4" onClick={() => onStatusChange?.("not_started")}>Not started</Button>
            <Button type="button" variant="ghost" className="h-10 px-4" onClick={() => onStatusChange?.("in_progress")}>In progress</Button>
            <Button type="button" variant="ghost" className="h-10 px-4" onClick={() => onStatusChange?.("complete")}>Complete</Button>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ToolRecommendationList title="Primary tools" toolIds={step.recommendedTools} />
        <ToolRecommendationList title="Alternate tools" toolIds={step.alternateTools} />
      </div>

      {editable ? (
        <div className="mt-5">
          <label className="grid gap-2">
            <span className="display-kicker text-[0.64rem] text-foreground/85">Step notes</span>
            <textarea
              value={step.notes}
              onChange={(event) => onNotesChange?.(event.target.value)}
              className="min-h-24 w-full rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
              placeholder="Add production notes, prompt changes, or editorial reminders."
            />
          </label>
        </div>
      ) : null}
    </article>
  );
}