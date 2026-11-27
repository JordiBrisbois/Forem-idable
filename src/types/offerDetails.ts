export interface OfferHighlight {
  label: string;
  value: string;
}

export interface OfferSection {
  title: string;
  content: string;
}

export type OfferDetailSource = "forem-detail-api" | "mirror" | "none";

/** What the details sheet and the (future) offer page render. */
export interface OfferDetails {
  description?: string;
  highlights: OfferHighlight[];
  sections: OfferSection[];
  source: OfferDetailSource;
}
