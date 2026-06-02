"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchDataExportRequests,
  generateDataExport,
} from "@/lib/api/account";
import { DataExportRequestSummary, FeedbackState } from "@/app/account/account.schemas";

export function useDataExports() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DataExportRequestSummary[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await fetchDataExportRequests();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch {
      setFeedback({ type: "error", message: "Chargement des exports impossible." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setRequests([]);
      return;
    }
    void load();
  }, [user, load]);

  const generate = useCallback(async () => {
    setIsGenerating(true);
    setFeedback(null);

    try {
      const { data } = await generateDataExport();
      if (!data.request) {
        setFeedback({ type: "error", message: "Export impossible." });
        return;
      }
      await load();
      setFeedback({ type: "success", message: "Export généré. Vous pouvez maintenant le télécharger." });
    } catch {
      setFeedback({ type: "error", message: "Export impossible." });
    } finally {
      setIsGenerating(false);
    }
  }, [load]);

  const download = useCallback((requestId: number) => {
    window.location.href = `/api/account/data-export/${requestId}`;
  }, []);

  return {
    requests,
    feedback,
    isLoading,
    isGenerating,
    load,
    generate,
    download,
  };
}
