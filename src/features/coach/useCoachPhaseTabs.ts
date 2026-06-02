"use client";

import { useCallback, useState } from "react";
import { CoachPhaseFilter } from "@/features/coach/types";

const STORAGE_KEY = "forem:coach:phase-tab:v2";

function getStoredPhase(): CoachPhaseFilter {
  if (typeof window === "undefined") return "all";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CoachPhaseFilter;
      const valid: CoachPhaseFilter[] = ["all", "internship_search", "job_search", "placed", "dropped"];
      if (valid.includes(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return "all";
}

export function useCoachPhaseTabs() {
  const [phaseFilter, setPhaseFilterState] = useState<CoachPhaseFilter>(getStoredPhase);

  const setPhaseFilter = useCallback((value: CoachPhaseFilter) => {
    setPhaseFilterState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, []);

  return { phaseFilter, setPhaseFilter };
}
