import { SearchQuery } from "@/types/search";
import { SearchHistoryEntry } from "@/features/jobs/types/searchHistory";

export function isSameSearchQuery(a: SearchQuery, b: SearchQuery): boolean {
  const sameKeywords =
    a.keywords.join("|").toLowerCase() === b.keywords.join("|").toLowerCase();
  const sameLocations =
    a.locations.map((loc) => loc.id).join("|") ===
    b.locations.map((loc) => loc.id).join("|");
  const sameMode = a.booleanMode === b.booleanMode;
  return sameKeywords && sameLocations && sameMode;
}

export function dedupeAndPrependHistory(
  current: SearchHistoryEntry[],
  next: SearchHistoryEntry,
  maxItems = 8
): SearchHistoryEntry[] {
  const deduped = current.filter((entry) => !isSameSearchQuery(entry.state, next.state));
  return [next, ...deduped].slice(0, maxItems);
}
