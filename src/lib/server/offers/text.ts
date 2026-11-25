/**
 * Text normalisation shared by the mirror's write and read paths.
 *
 * ODWB's `search()` was accent- and case-insensitive: "developpeur" matched
 * "Développeur". A plain `ILIKE` is not, so both the stored haystack and the
 * incoming keywords go through the same normaliser — otherwise a user typing
 * without accents would get an empty page.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    // Strip combining diacritics left by the decomposition.
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Splits a typed phrase into the tokens a search should all match. */
export function searchTokens(value: string): string[] {
  return normalizeSearchText(value)
    .split(" ")
    .filter((token) => token.length > 0);
}
