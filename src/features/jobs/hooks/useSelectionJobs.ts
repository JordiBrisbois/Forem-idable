"use client";

import { useMemo, useState } from "react";
import { Job } from "@/types/job";
import { toggleSelectionJob } from "@/features/jobs/utils/selectionJobs";

export function useSelectionJobs() {
  const [selectedJobs, setSelectedJobs] = useState<Job[]>([]);

  const selectedJobIds = useMemo(
    () => new Set(selectedJobs.map((job) => job.id)),
    [selectedJobs]
  );

  const toggleSelection = (job: Job) => {
    setSelectedJobs((prev) => toggleSelectionJob(prev, job));
  };

  const resetSelection = () => setSelectedJobs([]);

  return {
    selectedJobs,
    selectedJobIds,
    toggleSelection,
    resetSelection,
  };
}
