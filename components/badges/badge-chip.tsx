import { Award, BadgeCheck, Gem, Shield } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CreatorBadge } from "@/types";

const themeClasses: Record<string, string> = {
  gold: "border-[#c7a66a]/35 bg-[linear-gradient(180deg,rgba(199,166,106,0.12),rgba(199,166,106,0.04))] text-[#e7d1a0] shadow-[0_0_30px_rgba(199,166,106,0.08)]",
  silver: "border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] text-white/88",
  obsidian: "border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] text-white/86",
  ember: "border-[#b96b53]/35 bg-[linear-gradient(180deg,rgba(185,107,83,0.14),rgba(185,107,83,0.04))] text-[#f2c1a8]",
  velvet: "border-[#8f617f]/35 bg-[linear-gradient(180deg,rgba(143,97,127,0.15),rgba(143,97,127,0.04))] text-[#f0d7e5]",
  signal: "border-[#88a9c9]/28 bg-[linear-gradient(180deg,rgba(136,169,201,0.14),rgba(136,169,201,0.04))] text-[#d4e5f7]",
};

function getIcon(iconName: string | null) {
  switch (iconName) {
    case "shield":
      return Shield;
    case "gem":
      return Gem;
    case "badge-check":
      return BadgeCheck;
    case "laurel":
    default:
      return Award;
  }
}

export function BadgeChip({ badge, className }: { badge: CreatorBadge; className?: string }) {
  const Icon = getIcon(badge.iconName);
  const description = badge.foundingCreator?.isFoundingCreator
    ? badge.foundingCreator.founderNumber
      ? `${badge.description ?? badge.name} #${badge.foundingCreator.founderNumber}.`
      : badge.description ?? badge.name
    : badge.description ?? badge.name;
  const label = badge.slug === "founding-creator" && badge.foundingCreator?.founderNumber
    ? `${badge.name} #${badge.foundingCreator.founderNumber}`
    : badge.name;

  return (
    <span
      title={description}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] sm:px-3 sm:text-[11px] sm:tracking-[0.18em]",
        themeClasses[badge.theme] ?? themeClasses.gold,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}
