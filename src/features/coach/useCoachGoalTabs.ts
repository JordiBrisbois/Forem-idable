"use client";

import { useCallback, useState } from "react";
import { CoachGoalFilter } from "@/features/coach/types";

const STORAGE_KEY = "app:coach:goal-tab:v1";

function getStoredGoal(): CoachGoalFilter {
  if (typeof window === "undefined") return "all";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CoachGoalFilter;
      const valid: CoachGoalFilter[] = ["all", "internship", "job"];
      if (valid.includes(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return "all";
}

export function useCoachGoalTabs() {
  const [goalFilter, setGoalFilterState] = useState<CoachGoalFilter>(getStoredGoal);

  const setGoalFilter = useCallback((value: CoachGoalFilter) => {
    setGoalFilterState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, []);

  return { goalFilter, setGoalFilter };
}
