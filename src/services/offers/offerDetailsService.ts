import { fetchOfferDetails } from "@/lib/api/offers";
import type { OfferDetails } from "@/types/offerDetails";

export const offerDetailsService = {
  /**
   * One offer detail, as the API normalised it.
   *
   * The payload carries the job itself (`job`) so a deep link works without a
   * list, and `source` tells the UI whether the full text or only the mirrored
   * summary is available.
   */
  async getByOfferId(
    offerId: string,
    options?: { signal?: AbortSignal }
  ): Promise<OfferDetails | null> {
    try {
      const { data } = await fetchOfferDetails(offerId, options?.signal);
      return {
        description: data.description,
        highlights: data.highlights ?? [],
        sections: data.sections ?? [],
        source: data.source ?? "none",
        job: data.job ?? null,
      };
    } catch {
      return null;
    }
  },
};
