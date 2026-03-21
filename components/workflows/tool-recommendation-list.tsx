import { workflowToolCatalog } from "@/lib/constants/workflow-builder";
import type { WorkflowToolId } from "@/types";

type ToolRecommendationListProps = {
  title: string;
  toolIds: WorkflowToolId[];
};

export function ToolRecommendationList({ title, toolIds }: ToolRecommendationListProps) {
  if (toolIds.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
      <p className="display-kicker">{title}</p>
      <div className="mt-3 grid gap-3">
        {toolIds.map((toolId) => {
          const tool = workflowToolCatalog.find((item) => item.id === toolId);
          if (!tool) {
            return null;
          }

          return (
            <div key={tool.id} className="rounded-[18px] border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-foreground">{tool.name}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{tool.category}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}