import { cn } from "@/lib/utils";

type StatePanelProps = {
  title: string;
  description: string;
  className?: string;
};

export function StatePanel({ title, description, className }: StatePanelProps) {
  return (
    <div className={cn("surface-panel cinema-frame p-8", className)}>
      <h2 className="headline-lg">{title}</h2>
      <p className="body-sm mt-4 max-w-2xl">{description}</p>
    </div>
  );
}
