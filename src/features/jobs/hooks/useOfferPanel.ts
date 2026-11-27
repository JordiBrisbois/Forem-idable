"use client";

import { useMemo } from "react";
import { useOfferDetails } from "@/features/jobs/hooks/useOfferDetails";
import type { Job } from "@/types/job";

/**
 * Resolves the offer shown in the panel from the URL.
 *
 * The row the user clicked already carries the summary, so the panel opens
 * instantly; when the URL is opened directly (no list) the detail payload brings
 * the job back, which is what makes `?offre=…` shareable and bookmarkable.
 */
export function useOfferPanel(options: { jobs: Job[]; offerId: string | null }) {
  const { jobs, offerId } = options;
  const fromList = useMemo(
    () => (offerId ? jobs.find((job) => job.id === offerId) ?? null : null),
    [jobs, offerId]
  );

  const { details, status, error, prefetch } = useOfferDetails({
    offerId,
    enabled: Boolean(offerId),
  });

  const job = fromList ?? details?.job ?? null;

  return {
    job,
    details,
    status,
    error,
    prefetch,
    isOpen: Boolean(offerId && job),
  };
}
