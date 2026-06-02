"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchDeletionRequests,
  submitDeletionRequest,
  cancelDeletionRequest,
} from "@/lib/api/account";
import { AccountDeletionRequestSummary, FeedbackState } from "@/app/account/account.schemas";

export function useAccountDeletion() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccountDeletionRequestSummary[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await fetchDeletionRequests();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch {
      setFeedback({ type: "error", message: "Chargement des demandes impossible." });
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

  const submit = useCallback(async (reason: string) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const { data } = await submitDeletionRequest(reason);
      if (!data.request) {
        setFeedback({ type: "error", message: "Demande impossible." });
        return;
      }
      await load();
      setFeedback({ type: "success", message: "Demande de suppression enregistrée." });
    } catch {
      setFeedback({ type: "error", message: "Demande impossible." });
    } finally {
      setIsSubmitting(false);
    }
  }, [load]);

  const cancel = useCallback(async () => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const { data } = await cancelDeletionRequest();
      if (!data.request) {
        setFeedback({ type: "error", message: "Annulation impossible." });
        return;
      }
      await load();
      setFeedback({ type: "success", message: "Demande de suppression annulée." });
    } catch {
      setFeedback({ type: "error", message: "Annulation impossible." });
    } finally {
      setIsSubmitting(false);
    }
  }, [load]);

  return {
    requests,
    feedback,
    isLoading,
    isSubmitting,
    load,
    submit,
    cancel,
  };
}
