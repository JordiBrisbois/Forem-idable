"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useApplications } from "@/hooks/useApplications";
import { useSettings } from "@/hooks/useSettings";
import { useExportJobs } from "@/features/jobs/hooks/useExportJobs";
import { useJobSearch } from "@/features/jobs/hooks/useJobSearch";
import { useSelectionJobs } from "@/features/jobs/hooks/useSelectionJobs";
import { fromSearchParams, toSearchPath } from "@/features/jobs/utils/searchUrl";
import { fetchFeaturedSearches } from "@/lib/api/featuredSearches";
import { FeaturedSearch } from "@/types/featuredSearch";
import { Job } from "@/types/job";
import { SearchQuery } from "@/types/search";

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
  const urlQuery = fromSearchParams(searchParams);

  const updateUrlFromQuery = (query: SearchQuery) => {
    const nextPath = toSearchPath(pathname, query);
    router.replace(nextPath, { scroll: false });
  };

  const handleCopySearchLink = async () => {
    if (!jobSearch.lastSearchQuery) return;

    const path = toSearchPath(pathname, jobSearch.lastSearchQuery);
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
    if (hasAppliedInitialUrlQuery.current) return;
    hasAppliedInitialUrlQuery.current = true;

    if (!urlQuery) return;

    void jobSearch.executeSearch(urlQuery, { persistInHistory: false });
  }, [jobSearch, urlQuery]);

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

  const runFeaturedSearch = async (featuredSearch: FeaturedSearch) => {
    const query = featuredSearch.query;
    selection.resetSelection();
    updateUrlFromQuery(query);
    await jobSearch.executeSearch(query);
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
    requestAuthForApplications,
    replayPendingApplications,
    updateUrlFromQuery,
    trackJobs,
    openJobDetails,
    runFeaturedSearch,
  };
}
