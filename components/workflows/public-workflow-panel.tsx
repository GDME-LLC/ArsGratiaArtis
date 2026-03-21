import { WorkflowStepCard } from "@/components/workflows/workflow-step-card";
import { getWorkflowGoalLabel } from "@/lib/constants/workflow-builder";
import type { PublicWorkflow } from "@/types";

type PublicWorkflowPanelProps = {
  workflows: PublicWorkflow[];
  eyebrow?: string;
  title: string;
  description: string;
};

export function PublicWorkflowPanel({ workflows, eyebrow = "Creative Workflows", title, description }: PublicWorkflowPanelProps) {
  if (workflows.length === 0) {
    return null;
  }

  return (
    <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-7">
      <p className="display-kicker">{eyebrow}</p>
      <h2 className="headline-lg mt-3 text-foreground">{title}</h2>
      <p className="body-sm mt-4 max-w-3xl">{description}</p>

      <div className="mt-6 grid gap-5">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="rounded-[24px] border border-white/10 bg-black/20 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="display-kicker">{getWorkflowGoalLabel(workflow.goal)}</p>
                <h3 className="title-md mt-3 text-foreground">{workflow.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  {workflow.description || "A read-only workflow selected by the creator for public viewing."}
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {workflow.progressCount} of {workflow.totalSteps} steps complete
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {workflow.steps.map((step) => (
                <WorkflowStepCard key={step.id} step={step} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
