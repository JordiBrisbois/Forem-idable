"use client";

import { useCallback, useEffect, useState } from "react";
import type { SearchQuery, SearchFilters } from "@/types/search";

export interface JobAlertSummary {
  id: number;
  name: string;
  keywords: string[];
  booleanMode: "AND" | "OR";
  goal: "job" | "internship";
  contractTypes: string[];
  regimes: string[];
  sectors: string[];
  languages: string[];
  frequency: string;
  isActive: boolean;
  createdAt: string;
  lastSentAt: string | null;
}

export interface JobAlertDraft {
  query: SearchQuery;
  filters: SearchFilters;
  name?: string;
}

type CreateResult = { ok: true } | { ok: false; error: string };

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Saved searches for the signed-in user.
 *
 * Loaded as soon as the user is known so the results bar can show
 * "Alertes (2)" instead of a button that gives no clue the alerts already exist.
 */
export function useJobAlerts({ enabled }: { enabled: boolean }) {
  const [alerts, setAlerts] = useState<JobAlertSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setAlerts(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/alerts", { headers: { Accept: "application/json" } });
      if (!response.ok) {
        setAlerts(null);
        return;
      }
      const payload = (await response.json()) as { alerts?: JobAlertSummary[] };
      setAlerts(Array.isArray(payload.alerts) ? payload.alerts : []);
    } catch {
      setAlerts(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  const create = useCallback(
    async (draft: JobAlertDraft): Promise<CreateResult> => {
      const { query, filters } = draft;

      try {
        const response = await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draft.name?.trim() || undefined,
            keywords: query.keywords,
            locations: query.locations,
            booleanMode: query.booleanMode,
            goal: query.goal,
            contractTypes: query.contractTypes ?? [],
            regimes: filters.regimes,
            sectors: filters.sectors,
            languages: filters.languages,
            consent: true,
          }),
        });

        if (!response.ok) {
          return { ok: false, error: await readError(response, "Création impossible.") };
        }

        await refresh();
        return { ok: true };
      } catch {
        return { ok: false, error: "Création impossible pour le moment." };
      }
    },
    [refresh]
  );

  const remove = useCallback(
    async (alertId: number): Promise<boolean> => {
      setDeletingId(alertId);
      try {
        const response = await fetch(`/api/alerts/${alertId}`, { method: "DELETE" });
        if (!response.ok) return false;
        await refresh();
        return true;
      } catch {
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    [refresh]
  );

  return {
    alerts,
    count: alerts?.length ?? 0,
    isLoading,
    deletingId,
    create,
    remove,
    refresh,
  };
}
