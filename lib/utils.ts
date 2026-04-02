import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function normalizeCount(count: number) {
  if (!Number.isFinite(count)) {
    return 0;
  }

  return Math.max(0, Math.trunc(count));
}

function normalizeText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function formatCountValue(count: number) {
  return normalizeCount(count).toLocaleString("en-US");
}

export function formatCountLabel(count: number, singular: string, plural?: string) {
  const value = normalizeCount(count);
  return `${formatCountValue(value)} ${value === 1 ? singular : plural ?? `${singular}s`}`;
}

export function formatCommentCount(count: number) {
  return formatCountLabel(count, "comment");
}

export function formatFollowerCount(count: number) {
  return formatCountLabel(count, "follower");
}

export function formatLikeCount(count: number) {
  return formatCountLabel(count, "like");
}

export function resolveCreatorName(input: {
  handle?: string | null;
  displayName?: string | null;
}) {
  return normalizeText(input.handle) || normalizeText(input.displayName) || "Creator";
}

export function hasCreatorIdentity(input: {
  handle?: string | null;
  displayName?: string | null;
}) {
  return Boolean(normalizeText(input.handle) || normalizeText(input.displayName));
}

export function formatMonthYear(date: string | null | undefined) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}
export function formatReleaseDate(date: string | null | undefined) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeRelease(date: string | null | undefined, prefix = "Published") {
  if (!date) {
    return prefix ? `${prefix} on ArsNeos` : "Recently released";
  }

  const publishedAt = new Date(date).getTime();
  const now = Date.now();
  const diffMs = publishedAt - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const absDays = Math.abs(diffDays);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  let relativeLabel = "";

  if (absDays < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    relativeLabel = rtf.format(diffHours, "hour");
  } else if (absDays < 30) {
    relativeLabel = rtf.format(diffDays, "day");
  } else {
    const diffMonths = Math.round(diffDays / 30);

    if (Math.abs(diffMonths) < 12) {
      relativeLabel = rtf.format(diffMonths, "month");
    } else {
      const diffYears = Math.round(diffDays / 365);
      relativeLabel = rtf.format(diffYears, "year");
    }
  }

  return prefix ? `${prefix} ${relativeLabel}` : relativeLabel;
}
