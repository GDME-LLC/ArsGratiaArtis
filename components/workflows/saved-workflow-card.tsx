import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getWorkflowGoalLabel } from "@/lib/constants/workflow-builder";
import type { SavedWorkflow } from "@/types";

type SavedWorkflowCardProps = {
  workflow: SavedWorkflow;
};

function formatUpdatedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getVisibilityLabel(workflow: SavedWorkflow) {
  switch (workflow.visibilityScope) {
    case "theatre":
      return "Visible on Theatre";
    case "film_page":
      return "Visible on Film Page";
    case "theatre_and_film":
      return "Visible on Theatre and Film Page";
    default:
      return "Private to Creator Studio";
  }
}

export function SavedWorkflowCard({ workflow }: SavedWorkflowCardProps) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <p className="display-kicker">Creative Workflow</p>
      <h3 className="title-md mt-3 text-foreground">{workflow.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{getWorkflowGoalLabel(workflow.goal)}</p>
      <p className="mt-3 text-sm text-muted-foreground">{workflow.description || "Saved from the workflow builder and ready to continue."}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-foreground/72">{getVisibilityLabel(workflow)}</p>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${workflow.totalSteps > 0 ? (workflow.progressCount / workflow.totalSteps) * 100 : 0}%` }} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{workflow.progressCount} of {workflow.totalSteps} steps complete</span>
        <span>Updated {formatUpdatedDate(workflow.updatedAt)}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href={`/workflows/${workflow.id}`}>Continue Workflow</Link>
        </Button>
      </div>
    </article>
  );
}
