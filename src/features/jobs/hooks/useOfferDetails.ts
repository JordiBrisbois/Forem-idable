"use client";

import { useEffect, useMemo, useState } from "react";
import { OfferDetails } from "@/features/jobs/types/offerDetails";
import { offerDetailsService } from "@/services/offers/offerDetailsService";

interface UseOfferDetailsParams {
  offerId: string | null;
  source: string | undefined;
  open: boolean;
}

export function useOfferDetails({ offerId, source, open }: UseOfferDetailsParams) {
  const [cacheByOfferId, setCacheByOfferId] = useState<Record<string, OfferDetails>>({});

  useEffect(() => {
    if (!offerId || source !== "forem" || !open || cacheByOfferId[offerId]) return;

    const controller = new AbortController();

    void offerDetailsService
      .getByOfferId(offerId, { signal: controller.signal })
      .then((details) => {
        if (!details) return;
        setCacheByOfferId((prev) => ({ ...prev, [offerId]: details }));
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Impossible de charger les détails offre", error);
      });

    return () => controller.abort();
  }, [cacheByOfferId, offerId, open, source]);

  const details = useMemo(() => {
    if (!offerId) return null;
    return cacheByOfferId[offerId] ?? null;
  }, [cacheByOfferId, offerId]);

  return { details };
}
