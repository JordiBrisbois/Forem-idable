"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Job } from "@/types/job";
import { SearchQuery } from "@/types/search";
import { jobService } from "@/services/jobs/jobService";
import { ForemRateLimitedError } from "@/services/api/foremClient";
import { useSearchHistory } from "@/hooks/useSearchHistory";

// Keep the preload small (1 ODWB request) and page on demand via `loadMore`,
// to stay well under ODWB's anonymous quota.
const INITIAL_FETCH_LIMIT = 100;
const FETCH_CHUNK_SIZE = 100;

const RATE_LIMIT_MESSAGE =
  "Le service d'offres est momentanément limité (quota du fournisseur atteint). Réessayez plus tard.";

export function useJobSearch() {
  const { history, addEntry, clearHistory, isLoaded: isHistoryLoaded } = useSearchHistory();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
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
    setSearchError(null);
    setSearchSessionId((id) => id + 1);

    try {
      const response = await jobService.searchJobs({
        keywords: query.keywords,
        locations: query.locations,
        booleanMode: query.booleanMode,
        goal: query.goal,
        contractTypes: query.contractTypes,
        limit: INITIAL_FETCH_LIMIT,
        offset: 0,
      });
      setJobs(response.jobs);
      setNextOffset(INITIAL_FETCH_LIMIT);
      setHasMoreResults(response.jobs.length >= INITIAL_FETCH_LIMIT);
      return response.jobs;
    } catch (error) {
      if (error instanceof ForemRateLimitedError) {
        setSearchError(RATE_LIMIT_MESSAGE);
        toast.error(RATE_LIMIT_MESSAGE);
      } else {
        console.error("Erreur lors de la recherche", error);
        setSearchError("Impossible de charger les offres pour le moment.");
      }
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
        goal: lastSearchQuery.goal,
        contractTypes: lastSearchQuery.contractTypes,
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
      if (error instanceof ForemRateLimitedError) {
        toast.error(RATE_LIMIT_MESSAGE);
      } else {
        console.error("Erreur lors du chargement supplémentaire", error);
      }
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
    searchError,
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
