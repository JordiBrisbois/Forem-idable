"use client";

import { useCallback, useState } from "react";

export function useApplicationDialogs() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailsJobId, setDetailsJobId] = useState<string | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [interviewJobId, setInterviewJobId] = useState<string | null>(null);

  const openDetails = useCallback((jobId: string) => {
    setDetailsJobId(jobId);
  }, []);

  const closeDetails = useCallback(() => {
    setDetailsJobId(null);
  }, []);

  const openDelete = useCallback((jobId: string) => {
    setDeleteJobId(jobId);
  }, []);

  const closeDelete = useCallback(() => {
    setDeleteJobId(null);
  }, []);

  const openInterview = useCallback((jobId: string) => {
    setInterviewJobId(jobId);
  }, []);

  const closeInterview = useCallback(() => {
    setInterviewJobId(null);
  }, []);

  const openCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const closeCreate = useCallback(() => {
    setIsCreateOpen(false);
  }, []);

  return {
    isCreateOpen,
    detailsJobId,
    deleteJobId,
    interviewJobId,
    openDetails,
    closeDetails,
    openDelete,
    closeDelete,
    openInterview,
    closeInterview,
    openCreate,
    closeCreate,
  };
}
