import { resourceEntries } from "@/lib/constants/resources";

function normalizeResourceKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const resourceEntryMap = new Map(
  resourceEntries.flatMap((entry) => {
    const keys = new Set<string>([normalizeResourceKey(entry.name)]);
    return [...keys].map((key) => [key, entry] as const);
  }),
);

export function findResourceEntryByToolSlug(slug: string) {
  return resourceEntryMap.get(normalizeResourceKey(slug)) ?? null;
}
