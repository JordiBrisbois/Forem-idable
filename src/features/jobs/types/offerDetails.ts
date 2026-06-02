export interface OfferHighlight {
  label: string;
  value: string;
}

export interface OfferSection {
  title: string;
  content: string;
}

export interface OfferDetails {
  offerId: string;
  description?: string;
  highlights: OfferHighlight[];
  sections?: OfferSection[];
}
