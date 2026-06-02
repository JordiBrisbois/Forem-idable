import { get, post, del } from "@/lib/api/client";
import { SearchHistoryEntry } from "@/features/jobs/types/searchHistory";

export function fetchSearchHistory() {
  return get<{ history?: SearchHistoryEntry[] }>("/api/search-history", { cache: "no-store" });
}

export function addSearchHistoryEntry(entry: SearchHistoryEntry) {
  return post<{ history?: SearchHistoryEntry[] }>("/api/search-history", { entry });
}

export function clearSearchHistory() {
  return del<Record<string, never>>("/api/search-history");
}
