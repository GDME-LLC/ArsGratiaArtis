import { cn } from "@/lib/utils";
import type { FoundingCreatorInfo } from "@/types";

type FoundingCreatorBadgeProps = {
  founder: FoundingCreatorInfo;
  showNumber?: boolean;
  className?: string;
};

export function FoundingCreatorBadge({ founder, showNumber = false, className }: FoundingCreatorBadgeProps) {
  if (!founder.isFoundingCreator) {
    return null;
  }

  const label = showNumber && founder.founderNumber
    ? `Founding Creator #${founder.founderNumber}`
    : "Founding Creator";

  return (
    <span
      title="One of the first 20 creators on ArsGratia."
      className={cn(
        "inline-flex items-center rounded-full border border-[#c7a66a]/35 bg-[linear-gradient(180deg,rgba(199,166,106,0.12),rgba(199,166,106,0.04))] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#e7d1a0] shadow-[0_0_30px_rgba(199,166,106,0.08)]",
        className,
      )}
    >
      {label}
    </span>
  );
}
