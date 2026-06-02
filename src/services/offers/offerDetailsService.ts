import { fetchOfferDetails } from "@/lib/api/offers";
import { OfferDetails } from "@/features/jobs/types/offerDetails";

export const offerDetailsService = {
  async getByOfferId(
    offerId: string,
    options?: { signal?: AbortSignal }
  ): Promise<OfferDetails | null> {
    try {
      const { data } = await fetchOfferDetails(offerId, options?.signal);
      return {
        offerId,
        description: data.description,
        highlights: data.highlights || [],
        sections: data.sections || [],
      };
    } catch {
      return null;
    }
  },
};
