import { NextRequest, NextResponse } from "next/server";
import { isValidForemOfferId } from "@/lib/forem";
import { checkRateLimit } from "@/lib/server/rateLimit";

interface OfferHighlight {
  label: string;
  value: string;
}

interface OfferSection {
  title: string;
  content: string;
}

interface OfferDetailsResponse {
  description?: string;
  highlights: OfferHighlight[];
  sections: OfferSection[];
  source: "forem-detail-api" | "odwb-fallback" | "none";
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(asString).filter((item): item is string => Boolean(item));
}

function getFirstString(payload: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = asString(payload[key]);
    if (value) return value;
  }
  return null;
}

function getFirstArray(payload: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const items = asStringArray(payload[key]);
    if (items.length > 0) return items;
  }
  return [];
}

function pushHighlight(highlights: OfferHighlight[], label: string, value?: string | null) {
  if (!value) return;
  highlights.push({ label, value });
}

function pushSection(sections: OfferSection[], title: string, content?: string | null) {
  if (!content) return;
  const normalized = content.trim();
  if (!normalized) return;
  sections.push({ title, content: normalized });
}

function extractSectionsFromDescription(description?: string): OfferSection[] {
  if (!description) return [];

  const patterns = [
    { title: "Tâches / Missions", regex: /(t[aâ]ches?|missions?|fonction)\s*[:\-]/gi },
    { title: "Profil recherché", regex: /(profil|votre profil|comp[eé]tences?)\s*[:\-]/gi },
    { title: "Offre / Conditions", regex: /(offre|nous offrons|conditions?|avantages?)\s*[:\-]/gi },
  ] as const;

  const matches: Array<{ title: string; index: number; end: number }> = [];
  for (const pattern of patterns) {
    const match = pattern.regex.exec(description);
    if (match && typeof match.index === "number") {
      matches.push({
        title: pattern.title,
        index: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  if (matches.length < 2) return [];
  matches.sort((a, b) => a.index - b.index);

  const sections: OfferSection[] = [];
  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const next = matches[i + 1];
    const content = description.slice(current.end, next ? next.index : undefined).trim();
    pushSection(sections, current.title, content);
  }

  return sections;
}

function normalizeForemDetailPayload(
  payload: Record<string, unknown>,
  fallbackOfferId: string
): OfferDetailsResponse {
  const highlights: OfferHighlight[] = [];
  const sections: OfferSection[] = [];

  const description = getFirstString(payload, [
    "description",
    "descriptionOffre",
    "descriptionPoste",
    "texteAnnonce",
    "contenu",
    "body",
    "mission",
    "metier",
  ]) || undefined;

  pushSection(sections, "Tâches / Missions", getFirstString(payload, [
    "taches",
    "tâches",
    "missions",
    "mission",
    "fonction",
    "descriptionFonction",
  ]));
  pushSection(sections, "Profil recherché", getFirstString(payload, [
    "profil",
    "profilRecherche",
    "competences",
    "compétences",
    "descriptionProfil",
  ]));
  pushSection(sections, "Offre / Conditions", getFirstString(payload, [
    "offre",
    "conditions",
    "avantages",
    "nousOffrons",
  ]));
  if (sections.length === 0) {
    extractSectionsFromDescription(description).forEach((section) => sections.push(section));
  }

  const offreId =
    getFirstString(payload, ["numerooffreforem", "offreId", "idOffreEmploi"]) ||
    fallbackOfferId;
  const referenceExterne = getFirstString(payload, ["referenceexterne", "referenceExterne"]);

  pushHighlight(highlights, "Référence Forem", offreId);
  pushHighlight(highlights, "Référence externe", referenceExterne);
  pushHighlight(highlights, "Régime de travail", getFirstString(payload, ["regimetravail", "regimeTravail"]));
  pushHighlight(highlights, "Expérience requise", getFirstString(payload, ["experiencerequise", "experienceRequise"]));
  pushHighlight(highlights, "Permis", getFirstString(payload, ["permisdeconduire", "permisConduire"]));
  pushHighlight(highlights, "Date de fin de diffusion", getFirstString(payload, ["datefindiffusion", "dateFinDiffusion"]));

  const langues = getFirstArray(payload, ["langues"]);
  if (langues.length > 0) {
    highlights.push({ label: "Langues", value: langues.join(", ") });
  }

  const niveaux = getFirstArray(payload, ["niveauxetudes", "niveauxEtudes"]);
  if (niveaux.length > 0) {
    highlights.push({ label: "Études", value: niveaux.join(", ") });
  }

  const secteurs = getFirstArray(payload, ["secteurs"]);
  if (secteurs.length > 0) {
    highlights.push({ label: "Secteurs", value: secteurs.join(", ") });
  }

  return {
    description,
    highlights,
    sections,
    source: "forem-detail-api",
  };
}

function normalizeOdwbPayload(
  payload: Record<string, unknown>,
  fallbackOfferId: string
): OfferDetailsResponse {
  const highlights: OfferHighlight[] = [];
  const sections: OfferSection[] = [];

  const metier = asString(payload.metier);
  const description = metier || undefined;

  const offreId = asString(payload.numerooffreforem) || fallbackOfferId;
  const referenceExterne = asString(payload.referenceexterne);

  pushHighlight(highlights, "Référence Forem", offreId);
  pushHighlight(highlights, "Référence externe", referenceExterne);
  pushHighlight(highlights, "Régime de travail", asString(payload.regimetravail));
  pushHighlight(highlights, "Expérience requise", asString(payload.experiencerequise));
  pushHighlight(highlights, "Permis", asString(payload.permisdeconduire));
  pushHighlight(highlights, "Date de fin de diffusion", asString(payload.datefindiffusion));

  const nombrePostes = payload.nombrepostes;
  if (typeof nombrePostes === "number" && Number.isFinite(nombrePostes)) {
    highlights.push({ label: "Nombre de postes", value: String(nombrePostes) });
  }

  const langues = asStringArray(payload.langues);
  if (langues.length > 0) {
    highlights.push({ label: "Langues", value: langues.join(", ") });
  }

  const niveaux = asStringArray(payload.niveauxetudes);
  if (niveaux.length > 0) {
    highlights.push({ label: "Études", value: niveaux.join(", ") });
  }

  const secteurs = asStringArray(payload.secteurs);
  if (secteurs.length > 0) {
    highlights.push({ label: "Secteurs", value: secteurs.join(", ") });
  }

  return {
    description,
    highlights,
    sections,
    source: "odwb-fallback",
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimit = await checkRateLimit({
      scope: "offer-detail",
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans quelques instants." },
        { status: 429 }
      );
    }
    const { id } = await context.params;
    if (!id) return new NextResponse("Missing offer id", { status: 400 });
    if (!isValidForemOfferId(id)) {
      return new NextResponse("Invalid offer id", { status: 400 });
    }

    const detailCandidates = [
      `https://www.leforem.be/recherche-offres/api/offre-detail/${id}`,
      `https://www.leforem.be/recherche-offres/api/OffreDetail/${id}`,
    ];

    for (const url of detailCandidates) {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json,*/*",
          Referer: `https://www.leforem.be/recherche-offres/offre-detail/${id}`,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/json")) continue;

      const payload = (await response.json()) as Record<string, unknown>;
      const normalized = normalizeForemDetailPayload(payload, id);
      if (normalized.description || normalized.highlights.length > 0) {
        return NextResponse.json(normalized);
      }
    }

    const odwbUrl = new URL(
      "https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem/records"
    );
    odwbUrl.searchParams.set("limit", "1");
    odwbUrl.searchParams.set("where", `numerooffreforem="${id}"`);

    const odwbResponse = await fetch(odwbUrl.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!odwbResponse.ok) {
      return NextResponse.json<OfferDetailsResponse>({
        source: "none",
        highlights: [],
        sections: [],
      });
    }

    const data = await odwbResponse.json();
    const first = Array.isArray(data?.results) ? data.results[0] : null;
    if (!first || typeof first !== "object") {
      return NextResponse.json<OfferDetailsResponse>({
        source: "none",
        highlights: [],
        sections: [],
      });
    }

    return NextResponse.json(normalizeOdwbPayload(first as Record<string, unknown>, id));
  } catch (error) {
    console.error("Offer details route error:", error);
    return NextResponse.json<OfferDetailsResponse>({
      source: "none",
      highlights: [],
      sections: [],
    });
  }
}
