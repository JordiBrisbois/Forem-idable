/**
 * Absolute base URL of the instance.
 *
 * Used for canonical URLs, the sitemap and structured data, which all require an
 * absolute origin. `APP_BASE_URL` is the documented setting; `COOLIFY_URL` is the
 * fallback the rest of the app already relies on.
 */
export function siteBaseUrl(): string {
  return (
    process.env.APP_BASE_URL?.trim() ||
    process.env.COOLIFY_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}
