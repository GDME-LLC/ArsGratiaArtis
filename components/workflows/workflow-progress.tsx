import { cn } from "@/lib/utils";

type WorkflowProgressProps = {
  currentStep: number;
  totalSteps: number;
  labels: string[];
};

export function WorkflowProgress({ currentStep, totalSteps, labels }: WorkflowProgressProps) {
  const progress = Math.max(0, Math.min(100, (currentStep / totalSteps) * 100));

  return (
    <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="display-kicker">Workflow Builder</p>
        <p className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</p>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {labels.map((label, index) => {
          const stepNumber = index + 1;
          return (
            <div key={label} className={cn("rounded-2xl border px-3 py-3 text-sm transition", stepNumber <= currentStep ? "border-primary/30 bg-primary/10 text-foreground" : "border-white/10 bg-white/[0.03] text-muted-foreground")}>
              <p className="display-kicker text-[0.62rem]">0{stepNumber}</p>
              <p className="mt-2">{label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}