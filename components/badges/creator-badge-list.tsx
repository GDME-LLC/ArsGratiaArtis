import { BadgeChip } from "@/components/badges/badge-chip";
import type { CreatorBadge } from "@/types";

export function CreatorBadgeList({
  badges,
  className,
  itemClassName,
}: {
  badges: CreatorBadge[];
  className?: string;
  itemClassName?: string;
}) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      {badges.map((badge) => (
        <BadgeChip key={badge.id} badge={badge} className={itemClassName} />
      ))}
    </div>
  );
}
