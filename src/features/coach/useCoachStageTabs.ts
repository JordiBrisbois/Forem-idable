"use client";

import { useCallback, useState } from "react";
import { runtimeConfig } from "@/config/runtime";
import { CoachStageFilter } from "@/features/coach/types";

const STORAGE_KEY = `${runtimeConfig.app.storageNamespace}:coach:stage-tab:v1`;

function getStoredStage(): CoachStageFilter {
  if (typeof window === "undefined") return "all";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CoachStageFilter;
      const valid: CoachStageFilter[] = [
        "all",
        "internship_search",
        "internship_ongoing",
        "job_search",
        "employed",
        "exited",
      ];
      if (valid.includes(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return "all";
}

export function useCoachStageTabs() {
  const [stageFilter, setStageFilterState] = useState<CoachStageFilter>(getStoredStage);

  const setStageFilter = useCallback((value: CoachStageFilter) => {
    setStageFilterState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, []);

  return { stageFilter, setStageFilter };
}
