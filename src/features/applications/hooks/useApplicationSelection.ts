import { useCallback, useMemo, useState } from "react";
import {
  isFollowUpEnabled,
  shouldShowFollowUpDetails,
} from "@/features/applications/utils";
import { JobApplication } from "@/types/application";

interface UseApplicationSelectionOptions {
  visibleApplications: JobApplication[];
  allApplications: JobApplication[];
}

export function useApplicationSelection({
  visibleApplications,
  allApplications,
}: UseApplicationSelectionOptions) {
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((jobId: string) => {
    setSelectedJobIds((current) => {
      const next = new Set(current);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedJobIds(new Set());
  }, []);

  const isAllSelected = useMemo(
    () =>
      visibleApplications.length > 0 &&
      visibleApplications.every((app) => selectedJobIds.has(app.job.id)),
    [visibleApplications, selectedJobIds]
  );

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(new Set(visibleApplications.map((app) => app.job.id)));
    }
  }, [visibleApplications, isAllSelected]);

  const selectedFollowUpCount = useMemo(
    () =>
      allApplications.filter(
        (app) =>
          selectedJobIds.has(app.job.id) &&
          isFollowUpEnabled(app) &&
          shouldShowFollowUpDetails(app.status)
      ).length,
    [allApplications, selectedJobIds]
  );

  const selectedFollowUpDisabledCount = useMemo(
    () =>
      allApplications.filter(
        (app) =>
          selectedJobIds.has(app.job.id) &&
          !isFollowUpEnabled(app) &&
          shouldShowFollowUpDetails(app.status)
      ).length,
    [allApplications, selectedJobIds]
  );

  return {
    selectedJobIds,
    setSelectedJobIds,
    toggleSelection,
    clearSelection,
    isAllSelected,
    toggleSelectAll,
    selectedFollowUpCount,
    selectedFollowUpDisabledCount,
  };
}
