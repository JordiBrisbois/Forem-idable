"use client";

import { useState } from "react";
import { Job } from "@/types/job";
import { SearchQuery } from "@/types/search";
import { jobService } from "@/services/jobs/jobService";
import { useSearchHistory } from "@/hooks/useSearchHistory";

const INITIAL_FETCH_LIMIT = 1000;
const FETCH_CHUNK_SIZE = 1000;

export function useJobSearch() {
  const { history, addEntry, clearHistory, isLoaded: isHistoryLoaded } = useSearchHistory();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [searchSessionId, setSearchSessionId] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<SearchQuery | null>(null);
  const [nextOffset, setNextOffset] = useState(0);

  const executeSearch = async (query: SearchQuery, options?: { persistInHistory?: boolean }) => {
    const persistInHistory = options?.persistInHistory ?? true;

    setLastSearchQuery(query);
    if (persistInHistory) addEntry(query);
    setIsSearching(true);
    setHasSearched(true);
    setSearchSessionId((id) => id + 1);

    try {
      const response = await jobService.searchJobs({
        keywords: query.keywords,
        locations: query.locations,
        booleanMode: query.booleanMode,
        limit: INITIAL_FETCH_LIMIT,
        offset: 0,
      });
      setJobs(response.jobs);
      setNextOffset(INITIAL_FETCH_LIMIT);
      setHasMoreResults(response.jobs.length >= INITIAL_FETCH_LIMIT);
      return response.jobs;
    } catch (error) {
      console.error("Erreur lors de la recherche", error);
      setJobs([]);
      setNextOffset(0);
      setHasMoreResults(false);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const loadMore = async () => {
    if (!lastSearchQuery || isSearching || isLoadingMore || !hasMoreResults) return;

    setIsLoadingMore(true);
    try {
      const response = await jobService.searchJobs({
        keywords: lastSearchQuery.keywords,
        locations: lastSearchQuery.locations,
        booleanMode: lastSearchQuery.booleanMode,
        limit: FETCH_CHUNK_SIZE,
        offset: nextOffset,
      });

      setJobs((current) => {
        const seen = new Set(current.map((job) => job.id));
        const incoming = response.jobs.filter((job) => {
          if (seen.has(job.id)) return false;
          seen.add(job.id);
          return true;
        });

        return [...current, ...incoming];
      });
      if (response.jobs.length < FETCH_CHUNK_SIZE) {
        setHasMoreResults(false);
      }
      setNextOffset((offset) => offset + FETCH_CHUNK_SIZE);
    } catch (error) {
      console.error("Erreur lors du chargement supplémentaire", error);
      setHasMoreResults(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return {
    jobs,
    isSearching,
    isLoadingMore,
    hasMoreResults,
    searchSessionId,
    hasSearched,
    lastSearchQuery,
    executeSearch,
    loadMore,
    history,
    clearHistory,
    isHistoryLoaded,
  };
}
