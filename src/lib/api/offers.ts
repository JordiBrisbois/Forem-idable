import { get } from "@/lib/api/client";
import type { OfferDetails } from "@/types/offerDetails";

export function fetchOfferDetails(offerId: string, signal?: AbortSignal) {
  return get<Partial<OfferDetails>>(`/api/offers/${offerId}`, { signal });
}
