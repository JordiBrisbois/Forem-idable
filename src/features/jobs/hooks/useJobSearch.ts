"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Job } from "@/types/job";
import { DEFAULT_SEARCH_VIEW, NearPoint, PageSize, SearchFilters, SearchQuery, SearchSort, SearchView } from "@/types/search";
import { jobService } from "@/services/jobs/jobService";
import { OffersUnavailableError } from "@/services/api/offersClient";
import { useSearchHistory } from "@/hooks/useSearchHistory";

const TOO_MANY_REQUESTS_MESSAGE =
  "Trop de recherches en peu de temps. Réessayez dans quelques instants.";
const UNAVAILABLE_MESSAGE =
  "Le service d'offres est momentanément indisponible. Réessayez plus tard.";
const INDEXING_MESSAGE =
  "Les offres sont en cours d'indexation. Réessayez dans une minute.";

function messageFor(error: OffersUnavailableError): string {
  switch (error.reason) {
    case "rate_limited":
      return TOO_MANY_REQUESTS_MESSAGE;
    case "indexing":
      return INDEXING_MESSAGE;
    default:
      return UNAVAILABLE_MESSAGE;
  }
}

interface FetchRequest {
  query: SearchQuery;
  view: SearchView;
}

/**
 * Search state for the results page.
 *
 * Pagination, sorting and filters are server-side: every change fetches the
 * matching page from the mirror, and `total` comes from the database so the
 * pager is exact instead of "load more" guesses.
 */
export function useJobSearch() {
  const { history, addEntry, clearHistory, isLoaded: isHistoryLoaded } = useSearchHistory();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [view, setView] = useState<SearchView>(DEFAULT_SEARCH_VIEW);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSessionId, setSearchSessionId] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<SearchQuery | null>(null);

  const requestRef = useRef<FetchRequest | null>(null);

  const run = useCallback(async (request: FetchRequest) => {
    const { query, view: nextView } = request;
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await jobService.searchJobs({
        keywords: query.keywords,
        locations: query.locations,
        booleanMode: query.booleanMode,
        goal: query.goal,
        contractTypes: query.contractTypes,
        regimes: nextView.filters.regimes,
        sectors: nextView.filters.sectors,
        languages: nextView.filters.languages,
        sort: nextView.sort,
        near: nextView.near,
        limit: nextView.pageSize,
        offset: (nextView.page - 1) * nextView.pageSize,
      });

      setJobs(response.jobs);
      setTotal(response.total);
      setView(nextView);
      return response.jobs;
    } catch (error) {
      if (error instanceof OffersUnavailableError) {
        const message = messageFor(error);
        setSearchError(message);
        toast.error(message);
      } else {
        console.error("Erreur lors de la recherche", error);
        setSearchError(UNAVAILABLE_MESSAGE);
      }
      setJobs([]);
      setTotal(0);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const executeSearch = useCallback(
    async (
      query: SearchQuery,
      options?: { persistInHistory?: boolean; view?: SearchView }
    ) => {
      const persistInHistory = options?.persistInHistory ?? true;

      setLastSearchQuery(query);
      setHasSearched(true);
      setSearchSessionId((id) => id + 1);
      if (persistInHistory) addEntry(query);

      const request: FetchRequest = {
        query,
        view: options?.view ?? {
          ...DEFAULT_SEARCH_VIEW,
          filters: view.filters,
          near: view.near,
        },
      };
      requestRef.current = request;
      return run(request);
    },
    [addEntry, run, view.filters, view.near]
  );

  /** Fetches another page of the current search. */
  const goToPage = useCallback(
    async (page: number) => {
      const current = requestRef.current;
      if (!current) return;
      const target = Math.max(1, page);
      await run({ query: current.query, view: { ...current.view, page: target } });
    },
    [run]
  );

  const applyView = useCallback(
    async (patch: Partial<Omit<SearchView, "filters">> & { filters?: SearchFilters }) => {
      const current = requestRef.current;
      if (!current) return;

      const nextView: SearchView = {
        ...current.view,
        ...patch,
        filters: patch.filters ?? current.view.filters,
        // Any change other than the page itself restarts at page 1.
        page: patch.page ?? 1,
      };

      requestRef.current = { query: current.query, view: nextView };
      await run({ query: current.query, view: nextView });
    },
    [run]
  );

  const setSort = useCallback((sort: SearchSort) => void applyView({ sort }), [applyView]);
  const setPageSize = useCallback(
    (pageSize: PageSize) => void applyView({ pageSize }),
    [applyView]
  );
  const setFilters = useCallback(
    (filters: SearchFilters) => void applyView({ filters }),
    [applyView]
  );
  const setNear = useCallback(
    (near: NearPoint | undefined) => void applyView({ near }),
    [applyView]
  );

  return {
    jobs,
    total,
    page: view.page,
    pageSize: view.pageSize,
    sort: view.sort,
    filters: view.filters,
    near: view.near,
    isSearching,
    searchError,
    searchSessionId,
    hasSearched,
    lastSearchQuery,
    executeSearch,
    goToPage,
    setSort,
    setPageSize,
    setFilters,
    setNear,
    history,
    clearHistory,
    isHistoryLoaded,
  };
}
