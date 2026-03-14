import type { ModerationStatus } from "@/types";

export function getModerationStatusLabel(status: ModerationStatus) {
  switch (status) {
    case "pending_review":
      return "Under review";
    case "flagged":
      return "Flagged for review";
    case "removed":
      return "Removed";
    default:
      return "Active";
  }
}

export function getModerationStatusDescription(status: ModerationStatus, reason?: string | null) {
  const reasonText = reason?.trim() ? ` Reason: ${reason.trim()}` : "";

  switch (status) {
    case "pending_review":
      return `This release is hidden from public browse surfaces while it is reviewed.${reasonText}`;
    case "flagged":
      return `This release is currently hidden pending moderation review.${reasonText}`;
    case "removed":
      return `This release has been removed from public view.${reasonText}`;
    default:
      return "This release is active and visible wherever public releases are shown.";
  }
}
