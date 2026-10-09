/**
 * Optional Opendatasoft API key for the ODWB "offres d'emploi FOREM" dataset.
 * It lifts the request quota above the anonymous tier.
 *
 * - Client: `NEXT_PUBLIC_ODWB_API_KEY` (inlined at build; restrict the key to the
 *   app domain on Opendatasoft so an exposed browser key stays harmless).
 * - Server: `ODWB_API_KEY` (kept out of the client bundle) takes precedence when
 *   set, so routes like `/api/locations` and `/api/offers` use the server key.
 */
export function odwbApiKey(): string | undefined {
  const key = (process.env.NEXT_PUBLIC_ODWB_API_KEY ?? process.env.ODWB_API_KEY ?? "").trim();
  return key.length > 0 ? key : undefined;
}

/** Appends the `apikey` query param to an ODWB URL when a key is configured. */
export function appendOdwbApiKey(url: URL): URL {
  const key = odwbApiKey();
  if (key) {
    url.searchParams.set("apikey", key);
  }
  return url;
}
