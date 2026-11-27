import type { OfferDetails, OfferHighlight, OfferSection } from "@/types/offerDetails";

/**
 * The Forem front-end calls this endpoint itself; it returns the full offer
 * (description, tasks, how to apply, employer logo…), unlike the ODWB dataset
 * which only carries the structured summary.
 */
export function foremDetailUrl(offerId: string): string {
  return `https://www.leforem.be/recherche-offres/api/Diffusion/DetailOffre/${encodeURIComponent(offerId)}`;
}

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&eacute;": "é",
  "&egrave;": "è",
  "&agrave;": "à",
  "&ccedil;": "ç",
  "&ugrave;": "ù",
  "&ocirc;": "ô",
  "&icirc;": "î",
  "&acirc;": "â",
  "&ecirc;": "ê",
  "&euml;": "ë",
  "&iuml;": "ï",
  "&euro;": "€",
  "&deg;": "°",
  "&laquo;": "«",
  "&raquo;": "»",
  "&rsquo;": "’",
};

/**
 * Turns the Forem HTML fragments into readable text.
 *
 * The description is third-party content and is rendered as text, never
 * injected as HTML: stripping here is what keeps the details sheet free of XSS.
 */
export function htmlToText(html: string): string {
  if (!html) return "";

  const withoutScripts = html
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, "");

  const withBreaks = withoutScripts
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*p\s*>/gi, "\n\n")
    .replace(/<\s*li[^>]*>/gi, "\n• ")
    .replace(/<\s*\/\s*(ul|ol)\s*>/gi, "\n");

  const withoutTags = withBreaks.replace(/<[^>]+>/g, "");

  const decoded = withoutTags
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&[a-z]+;|&#\d+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? entity);

  return decoded
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

/** Forem sends some lists as strings, others as `{ libelle }` objects. */
function asList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const single = asString(value);
    return single ? [single] : [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return asString(record.libelle) ?? asString(record.label) ?? asString(record.nom);
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

function section(title: string, content: string | null): OfferSection | null {
  if (!content) return null;
  return { title, content };
}

function highlight(label: string, value: string | null): OfferHighlight | null {
  if (!value) return null;
  return { label, value };
}

/**
 * Maps the Forem detail payload onto what the UI renders.
 *
 * The employer logo (≈90 KB of base64) and the Google metadata block are
 * dropped: they are not displayed and would bloat the cache for nothing.
 */
export function normalizeForemDetail(
  payload: Record<string, unknown>,
  fallbackOfferId: string
): OfferDetails {
  const description =
    htmlToText(asString(payload.descriptionJob) ?? "") ||
    htmlToText(asString(payload.commentaireGeneral) ?? "") ||
    asString(payload.metier) ||
    undefined;

  const sections = [
    section(
      "Conditions et profil",
      description && asString(payload.commentaireGeneral) && htmlToText(String(payload.commentaireGeneral)) !== description
        ? htmlToText(String(payload.commentaireGeneral))
        : null
    ),
    section("Comment postuler", htmlToText(asString(payload.howToApply) ?? "") || null),
  ].filter((item): item is OfferSection => item !== null);

  const highlights = [
    highlight("Employeur", asString(payload.nomEmployeur)),
    highlight("Partenaire", asString(payload.nomPartenaire)),
    highlight("Contrat", asString(payload.typeContrat)),
    highlight("Régime de travail", asString(payload.regimeTravail)),
    highlight("Expérience requise", asString(payload.experience)),
    highlight("Études", asList(payload.niveauxEtudes).join(", ")),
    highlight("Langues", asList(payload.langues).join(", ")),
    highlight("Permis", asList(payload.permisConduire).join(", ")),
    highlight("Secteur", asString(payload.secteurActiviteEmployeur)),
    highlight(
      "Lieu de travail",
      asList(payload.lieuxTravail)
        .map((place) => place)
        .join(", ")
    ),
    highlight("Nombre de postes", asString(payload.nombrePostes)),
    highlight("Date de fin de diffusion", asString(payload.dateFinDiffusion)),
    highlight("Référence Forem", asString(payload.numero) ?? fallbackOfferId),
    highlight("Référence partenaire", asString(payload.referenceOffrePartenaire)),
  ].filter((item): item is OfferHighlight => item !== null);

  return {
    description,
    sections,
    highlights,
    source: "forem-detail-api",
  };
}

/** Locally mirrored record: structured summary only, no free-text description. */
export function normalizeMirrorDetail(
  payload: Record<string, unknown>,
  fallbackOfferId: string
): OfferDetails {
  const description = asString(payload.metier) ?? undefined;

  const highlights = [
    highlight("Référence Forem", asString(payload.numerooffreforem) ?? fallbackOfferId),
    highlight("Référence externe", asString(payload.referenceexterne)),
    highlight("Régime de travail", asString(payload.regimetravail)),
    highlight("Expérience requise", asString(payload.experiencerequise)),
    highlight("Permis", asList(payload.permisdeconduire).join(", ")),
    highlight("Date de fin de diffusion", asString(payload.datefindiffusion)),
    highlight("Nombre de postes", asString(payload.nombrepostes)),
    highlight("Langues", asList(payload.langues).join(", ")),
    highlight("Études", asList(payload.niveauxetudes).join(", ")),
    highlight("Secteurs", asList(payload.secteurs).join(", ")),
  ].filter((item): item is OfferHighlight => item !== null);

  return {
    description,
    highlights,
    sections: [],
    source: "mirror",
  };
}
