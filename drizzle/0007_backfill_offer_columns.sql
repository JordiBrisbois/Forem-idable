-- Backfill the columns added after the mirror was first populated.
--
-- The offers were already stored with their full upstream payload, so the new
-- filters (regime, sectors, languages) and the distance search can be derived
-- from it without waiting for a successful re-sync. The next sync overwrites
-- these values with the normalised version.
--
-- Idempotent: only rows where `regime` is still NULL are touched.

UPDATE "forem_offers" AS offers
SET
  regime = NULLIF(offers.payload ->> 'regimetravail', ''),
  sectors = CASE
    WHEN jsonb_typeof(offers.payload -> 'secteurs') = 'array' THEN COALESCE(
      (
        SELECT array_agg(lower(value))
        FROM jsonb_array_elements_text(offers.payload -> 'secteurs') AS value
      ),
      '{}'::text[]
    )
    ELSE '{}'::text[]
  END,
  languages = CASE
    WHEN jsonb_typeof(offers.payload -> 'langues') = 'array' THEN COALESCE(
      (
        SELECT array_agg(lower(value))
        FROM jsonb_array_elements_text(offers.payload -> 'langues') AS value
      ),
      '{}'::text[]
    )
    ELSE '{}'::text[]
  END,
  latitude = CASE
    WHEN jsonb_typeof(offers.payload -> 'lieuxtravailgeo') = 'array'
      AND jsonb_typeof(offers.payload -> 'lieuxtravailgeo' -> 0) = 'object'
      AND (offers.payload -> 'lieuxtravailgeo' -> 0 ->> 'lat') ~ '^-?[0-9.]+$'
    THEN (offers.payload -> 'lieuxtravailgeo' -> 0 ->> 'lat')::double precision
    ELSE NULL
  END,
  longitude = CASE
    WHEN jsonb_typeof(offers.payload -> 'lieuxtravailgeo') = 'array'
      AND jsonb_typeof(offers.payload -> 'lieuxtravailgeo' -> 0) = 'object'
      AND (offers.payload -> 'lieuxtravailgeo' -> 0 ->> 'lon') ~ '^-?[0-9.]+$'
    THEN (offers.payload -> 'lieuxtravailgeo' -> 0 ->> 'lon')::double precision
    ELSE NULL
  END
WHERE offers.payload ? 'titreoffre'
  AND offers.regime IS NULL;
