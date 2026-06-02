"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { SearchQuery } from "@/types/search";
import {
  SearchHistoryEntry,
  searchHistoryArraySchema,
} from "@/features/jobs/types/searchHistory";
import {
  fetchSearchHistory,
  addSearchHistoryEntry as apiAddSearchHistoryEntry,
  clearSearchHistory as apiClearSearchHistory,
} from "@/lib/api/searchHistory";

export function useSearchHistory() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);

    try {
      const { data } = await fetchSearchHistory();
      const parsedHistory = searchHistoryArraySchema.safeParse(data.history);
      setHistory(parsedHistory.success ? parsedHistory.data : []);
    } catch {
      setHistory([]);
    } finally {
      setIsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthLoading) return;
    void refresh();
  }, [isAuthLoading, refresh]);

  const addEntry = async (state: SearchQuery) => {
    if (!user) return false;

    const entry: SearchHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      state,
      createdAt: new Date().toISOString(),
    };

    try {
      const { data } = await apiAddSearchHistoryEntry(entry);
      const parsedHistory = searchHistoryArraySchema.safeParse(data.history);
      setHistory(parsedHistory.success ? parsedHistory.data : []);
      return true;
    } catch {
      return false;
    }
  };

  const clearHistory = async () => {
    if (!user) return false;

    try {
      await apiClearSearchHistory();
      setHistory([]);
      return true;
    } catch {
      return false;
    }
  };

  return { history, addEntry, clearHistory, isLoaded, isAuthenticated: Boolean(user) };
}
