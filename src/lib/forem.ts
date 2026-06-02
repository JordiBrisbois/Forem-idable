import { runtimeConfig } from "@/config/runtime";

const FOREM_OFFER_ID_PATTERN = /^\d{1,20}$/;
const FOREM_OFFER_HOST_PATTERN = /(^|\.)leforem\.be$/i;
const FOREM_OFFER_PATH_PATTERN = /^\/recherche-offres\/offre-detail\/\d+(?:\/.*)?$/i;

export function isValidForemOfferId(value: string): boolean {
  return FOREM_OFFER_ID_PATTERN.test(value);
}

export function isForemOfferUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      FOREM_OFFER_HOST_PATTERN.test(url.hostname) &&
      FOREM_OFFER_PATH_PATTERN.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export function appendForemTrackingParam(
  value: string,
  trackingSource = runtimeConfig.app.baseUrl
): string {
  const trimmedValue = value.trim();
  const normalizedTrackingSource = trackingSource.trim();

  if (!trimmedValue || !normalizedTrackingSource || !isForemOfferUrl(trimmedValue)) {
    return trimmedValue;
  }

  try {
    const url = new URL(trimmedValue);
    url.searchParams.set("utm_source", normalizedTrackingSource);
    return url.toString();
  } catch {
    return trimmedValue;
  }
}
