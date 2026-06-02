export interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function geocodeTown(query: string): Promise<NominatimResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "be"); // Focus Belgique

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "FOREM-idable/1.0" },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as NominatimResult[];
  return data[0] ?? null;
}
