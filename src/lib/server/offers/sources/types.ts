import type { NormalizedOffer } from "../normalize";

export interface OffersSnapshot {
  offers: NormalizedOffer[];
  total: number;
}

/** Reads the whole upstream dataset. One call, one unit of the shared quota. */
export type OffersFetch = () => Promise<OffersSnapshot>;

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
