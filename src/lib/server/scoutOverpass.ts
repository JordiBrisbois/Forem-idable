export interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: Record<string, string>;
}

const OVERPASS_URLS = [
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
];

export const SCOUT_CATEGORIES: Record<string, string> = {
  "office=accountant": "Fiduciaire",
  "office=notary": "Notaire",
  "office=lawyer": "Avocat",
  "office=insurance": "Assurance",
  "office=estate_agent": "Immobilier",
  "office=association": "ASBL",
  "office=ngo": "ONG",
  "office=charity": "ASBL",
  "office=educational_institution": "Éducation",
  "office=government": "Public",
  "office=employment_agency": "Emploi",
  "office=administrative": "Admin",
  "office=architect": "Architecte",
  "office=it": "Informatique",
  "office=consulting": "Consulting",
  "office=financial": "Finance",
  "office=tax_advisor": "Conseil fiscal",
  "office=travel_agent": "Agence de voyage",
  "office=property_management": "Gestion immo",
  "office=newspaper": "Presse",
  "office=political_party": "Parti politique",
  "office=therapist": "Thérapeute",
  "office=union": "Syndicat",
  "office=research": "Recherche",
  "office=graphic_design": "Design",
  "amenity=social_facility": "Social",
  "amenity=pharmacy": "Pharmacie",
  "amenity=bank": "Banque",
  "amenity=post_office": "Poste",
  "amenity=clinic": "Santé",
  "amenity=doctors": "Santé",
  "amenity=dentist": "Santé",
  "amenity=veterinary": "Vétérinaire",
  "amenity=coworking_space": "Coworking",
  "shop=insurance": "Assurance",
  "amenity=nursing_home": "Maison de repos",
  "amenity=hospital": "Hôpital",
  "amenity=library": "Bibliothèque",
  "amenity=community_centre": "Centre culturel",
  "amenity=kindergarten": "Garderie",
  "tourism=hotel": "Hôtel",
  "tourism=guest_house": "Gîte/Chambre hôte",
  "shop=travel_agency": "Agence de voyage",
  "shop=optician": "Opticien",
  "shop=funeral_directors": "Pompes funèbres",
};

export function buildOverpassQuery(categories: string[], radius: number, lat: number, lon: number): string {
  const filters = categories
    .map((cat) => {
      const [key, val] = cat.split("=");
      if (!key || !val) return "";
      return (
        `  node["${key}"="${val}"](around:${radius},${lat},${lon});\n` +
        `  way["${key}"="${val}"](around:${radius},${lat},${lon});\n`
      );
    })
    .join("");

  return `[out:json][timeout:45];\n(\n${filters});\nout body center;`;
}

export async function queryOverpass(
  query: string,
  signal?: AbortSignal
): Promise<OverpassElement[]> {
  for (const endpoint of OVERPASS_URLS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "FOREM-idable/1.0",
        },
        body: new URLSearchParams({ data: query }),
        signal,
      });

      if (!res.ok) {
        if (res.status === 429) {
          await sleep(5000);
          continue;
        }
        if (res.status === 504) {
          await sleep(3000);
          continue;
        }
        continue;
      }

      const json = (await res.json()) as { elements?: OverpassElement[] };
      return json.elements ?? [];
    } catch {
      continue;
    }
  }

  return [];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseOverpassElements(elements: OverpassElement[]): Array<{
  osmId: number;
  name: string;
  type: string;
  email: string;
  website: string;
  phone: string;
  address: string;
  lat: number | null;
  lon: number | null;
  town: string;
}> {
  const seen = new Set<number>();
  const results = [];

  for (const el of elements) {
    if (seen.has(el.id)) continue;
    seen.add(el.id);

    const tags = el.tags;
    const name = tags.name;
    if (!name) continue;

    const addrParts: string[] = [];
    for (const k of ["addr:street", "addr:housenumber", "addr:postcode", "addr:city"] as const) {
      const v = tags[k];
      if (v) addrParts.push(v);
    }

    let category: string | null = null;
    for (const [key, label] of Object.entries(SCOUT_CATEGORIES)) {
      const [k, v] = key.split("=");
      if (tags[k] === v) {
        category = label;
        break;
      }
    }

    results.push({
      osmId: el.id,
      name,
      type: category ?? tags.office ?? tags.amenity ?? tags.shop ?? "?",
      email: tags.email ?? tags["contact:email"] ?? "",
      website: tags.website ?? tags["contact:website"] ?? "",
      phone: tags.phone ?? tags["contact:phone"] ?? "",
      address: addrParts.join(" "),
      lat: el.lat ?? el.center?.lat ?? null,
      lon: el.lon ?? el.center?.lon ?? null,
      town: tags["addr:city"] ?? "",
    });
  }

  return results;
}
