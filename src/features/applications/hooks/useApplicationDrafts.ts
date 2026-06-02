"use client";

import { useCallback, useState } from "react";

export function useApplicationDrafts() {
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [proofsDrafts, setProofsDrafts] = useState<Record<string, string>>({});

  const setNotesDraft = useCallback((jobId: string, value: string) => {
    setNotesDrafts((current) => ({ ...current, [jobId]: value }));
  }, []);

  const setProofsDraft = useCallback((jobId: string, value: string) => {
    setProofsDrafts((current) => ({ ...current, [jobId]: value }));
  }, []);

  const clearDrafts = useCallback((jobId: string) => {
    setNotesDrafts((current) => {
      const next = { ...current };
      delete next[jobId];
      return next;
    });
    setProofsDrafts((current) => {
      const next = { ...current };
      delete next[jobId];
      return next;
    });
  }, []);

  return {
    notesDrafts,
    proofsDrafts,
    setNotesDraft,
    setProofsDraft,
    clearDrafts,
  };
}
