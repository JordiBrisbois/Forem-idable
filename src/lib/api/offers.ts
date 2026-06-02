import { get } from "@/lib/api/client";
import { OfferDetails } from "@/features/jobs/types/offerDetails";

export function fetchOfferDetails(offerId: string, signal?: AbortSignal) {
  return get<Partial<OfferDetails>>(`/api/offers/${offerId}`, { signal });
}
