import type { Job } from "@/types/job";

export interface OfferHighlight {
  label: string;
  value: string;
}

export interface OfferSection {
  title: string;
  content: string;
}

export type OfferDetailSource = "forem-detail-api" | "mirror" | "none";

/**
 * What the offer panel, the offer page and the details API all speak.
 *
 * `job` is optional: the list already has it when the panel opens from a row,
 * and the API fills it in for a deep link (no list) or a page load.
 */
export interface OfferDetails {
  description?: string;
  highlights: OfferHighlight[];
  sections: OfferSection[];
  source: OfferDetailSource;
  job?: Job | null;
}
