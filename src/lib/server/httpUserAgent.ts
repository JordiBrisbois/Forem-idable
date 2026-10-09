import { runtimeConfig } from "@/config/runtime";

/**
 * Descriptive User-Agent for outbound requests to third-party services
 * (Nominatim, Overpass, scout autocomplete). Derived from the configured
 * branding so self-hosted instances identify themselves correctly.
 */
export function getScoutUserAgent(): string {
  const product = runtimeConfig.app.exportFilenamePrefix || "app";
  const contact = runtimeConfig.privacy.contactEmail || runtimeConfig.privacy.sourceUrl;
  return contact ? `${product}/1.0 (${contact})` : `${product}/1.0`;
}
