import type { NormalizedOffer } from "../normalize";

/** How many rows one upstream page holds. Shared by both sources: offsets in
 *  the sync loop are expressed in records, not pages. */
export const PAGE_SIZE = 100;

export interface OfferPage {
  offers: NormalizedOffer[];
  total: number;
}

export type OfferPageFetcher = (offset: number) => Promise<OfferPage>;

export type SourceFailure = "rate-limited" | "budget" | "upstream";

export class OffersSourceError extends Error {
  constructor(
    message: string,
    readonly kind: SourceFailure
  ) {
    super(message);
    this.name = "OffersSourceError";
  }
}

/** Last page when the upstream reports a smaller total than the page size. */
export function isLastPage(offset: number, received: number, total: number): boolean {
  if (received < PAGE_SIZE) return true;
  return total > 0 && offset + received >= total;
}
