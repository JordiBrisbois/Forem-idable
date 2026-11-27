"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useApplications } from "@/hooks/useApplications";
import { useSettings } from "@/hooks/useSettings";
import { useExportJobs } from "@/features/jobs/hooks/useExportJobs";
import { useJobSearch } from "@/features/jobs/hooks/useJobSearch";
import { useSelectionJobs } from "@/features/jobs/hooks/useSelectionJobs";
import { parseSearchLocation, toSearchPath } from "@/features/jobs/utils/searchUrl";
import { fetchFeaturedSearches } from "@/lib/api/featuredSearches";
import { FeaturedSearch } from "@/types/featuredSearch";
import { Job } from "@/types/job";
import { SearchQuery, SearchView } from "@/types/search";

export function useHomePageState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasAppliedInitialUrlQuery = useRef(false);
  const { user } = useAuth();
  const { settings, isLoaded } = useSettings();
  const jobSearch = useJobSearch();
  const selection = useSelectionJobs();
  const applications = useApplications();
  const exportState = useExportJobs();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAuthRequiredOpen, setIsAuthRequiredOpen] = useState(false);
  const [pendingApplicationJobs, setPendingApplicationJobs] = useState<Job[]>([]);
  const [featuredSearches, setFeaturedSearches] = useState<FeaturedSearch[]>([]);
  const [isFeaturedSearchesLoading, setIsFeaturedSearchesLoading] = useState(true);
  const location = parseSearchLocation(searchParams);
  const urlQuery = location.query;
  const lastSyncedUrl = useRef<string | null>(null);

  const currentView: SearchView = {
    sort: jobSearch.sort,
    page: jobSearch.page,
    pageSize: jobSearch.pageSize,
    filters: jobSearch.filters,
  };

  const updateUrlFromQuery = (query: SearchQuery, view: SearchView = currentView) => {
    const nextPath = toSearchPath(pathname, query, view);
    lastSyncedUrl.current = nextPath;
    router.replace(nextPath, { scroll: false });
  };

  const handleCopySearchLink = async () => {
    if (!jobSearch.lastSearchQuery) return;

    const path = toSearchPath(pathname, jobSearch.lastSearchQuery, currentView);
    const absoluteUrl =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

    try {
      await navigator.clipboard.writeText(absoluteUrl);
    } catch (error) {
      console.error("Impossible de copier le lien de recherche", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    void fetchFeaturedSearches()
      .then(({ data }) => {
        if (!isMounted || !Array.isArray(data.featuredSearches)) {
          return;
        }

        setFeaturedSearches(data.featuredSearches);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) {
          setIsFeaturedSearchesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Wait for the params to be available: on the first client render
    // `useSearchParams` can still be empty, and arming the guard before that
    // meant a shared search URL never ran (the empty state was shown instead).
    if (hasAppliedInitialUrlQuery.current) return;
    if (!urlQuery) return;

    hasAppliedInitialUrlQuery.current = true;

    void jobSearch.executeSearch(urlQuery, {
      persistInHistory: false,
      view: location.view,
    });
  }, [jobSearch, urlQuery, location.view]);

  const handleSearch = async (state: SearchQuery) => {
    selection.resetSelection();
    updateUrlFromQuery(state);
    await jobSearch.executeSearch(state);
  };

  const requestAuthForApplications = (jobsToTrack: Job[]) => {
    setPendingApplicationJobs(jobsToTrack);
    setIsAuthRequiredOpen(true);
  };

  const trackJobs = async (jobsToTrack: Job[]) => {
    for (const job of jobsToTrack) {
      await applications.addApplication(job);
    }
  };

  const replayPendingApplications = async () => {
    if (pendingApplicationJobs.length === 0) return;

    await trackJobs(pendingApplicationJobs);
    selection.resetSelection();
    setPendingApplicationJobs([]);
  };

  const openJobDetails = (job: Job) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  /**
   * Applies a view change (page, sort, filters, location) and writes it to the
   * URL in one place, so a copied link reproduces the exact screen without an
   * effect that could race the initial-URL restore.
   */
  const applyView = (
    patch: Partial<Omit<SearchView, "filters">> & {
      filters?: typeof jobSearch.filters;
      near?: SearchView["near"];
    }
  ) => {
    if (!jobSearch.lastSearchQuery) return;

    const nextView: SearchView = {
      sort: patch.sort ?? jobSearch.sort,
      page: patch.page ?? jobSearch.page,
      pageSize: patch.pageSize ?? jobSearch.pageSize,
      filters: patch.filters ?? jobSearch.filters,
      near: "near" in patch ? patch.near : jobSearch.near,
    };
    updateUrlFromQuery(jobSearch.lastSearchQuery, nextView);
  };

  const runFeaturedSearch = async (featuredSearch: FeaturedSearch) => {
    const query = featuredSearch.query;
    selection.resetSelection();
    updateUrlFromQuery(query);
    await jobSearch.executeSearch(query);
  };

  const handlePageChange = (nextPage: number) => {
    applyView({ page: nextPage });
    void jobSearch.goToPage(nextPage);
  };

  const handlePageSizeChange = (nextPageSize: SearchView["pageSize"]) => {
    applyView({ pageSize: nextPageSize });
    void jobSearch.setPageSize(nextPageSize);
  };

  const handleSortChange = (nextSort: SearchView["sort"]) => {
    applyView({ sort: nextSort });
    void jobSearch.setSort(nextSort);
  };

  const handleFiltersChange = (nextFilters: SearchView["filters"]) => {
    applyView({ filters: nextFilters });
    void jobSearch.setFilters(nextFilters);
  };

  const handleNearChange = (nextNear: SearchView["near"]) => {
    applyView({ near: nextNear });
    void jobSearch.setNear(nextNear);
  };

  return {
    user,
    isPageReady: isLoaded,
    settings,
    selectedJob,
    isDetailsOpen,
    isAuthRequiredOpen,
    featuredSearches,
    isFeaturedSearchesLoading,
    urlQuery,
    ...jobSearch,
    ...selection,
    ...applications,
    ...exportState,
    areApplicationsLoaded: applications.isLoaded,
    isApplicationAuth: applications.isAuthenticated,
    setIsDetailsOpen,
    setIsAuthRequiredOpen,
    handleSearch,
    handleCopySearchLink,
    handlePageChange,
    handlePageSizeChange,
    handleSortChange,
    handleFiltersChange,
    handleNearChange,
    requestAuthForApplications,
    replayPendingApplications,
    updateUrlFromQuery,
    trackJobs,
    openJobDetails,
    runFeaturedSearch,
  };
}
