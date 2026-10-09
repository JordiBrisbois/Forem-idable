import { NextResponse } from "next/server";

/**
 * Ordered domain-error → HTTP mappings. First `includes` match wins, so more
 * specific codes must come before generic ones (e.g. SelfRemovalForbidden
 * before Forbidden).
 */
const MAPPINGS: Array<{ match: string; status: number; message: string }> = [
  {
    match: "CannotDemoteSelf",
    status: 400,
    message: "Vous ne pouvez pas retirer votre propre rôle administrateur.",
  },
  {
    match: "LastAdmin",
    status: 400,
    message: "Impossible : il doit rester au moins un administrateur.",
  },
  {
    match: "Coach assignment required",
    status: 400,
    message: "Le manager doit être un coach déjà attribué à cette classe.",
  },
  {
    match: "SelfRemovalForbidden",
    status: 400,
    message: "Un coach ne peut pas se retirer lui-même d'une classe attribuée.",
  },
  {
    match: "Coach required",
    status: 400,
    message: "Seuls les comptes coach peuvent être attribués.",
  },
  {
    match: "Beneficiary required",
    status: 400,
    message: "Seuls les bénéficiaires peuvent être ajoutés à une classe.",
  },
  {
    match: "Shared note content required",
    status: 400,
    message: "Contenu de note partagée requis.",
  },
  {
    match: "Manual job editing forbidden",
    status: 403,
    message: "Seules les candidatures manuelles peuvent modifier ces champs.",
  },
  { match: "Invalid group", status: 400, message: "Classe invalide." },
  { match: "Group not found", status: 404, message: "Classe introuvable." },
  { match: "Application not found", status: 404, message: "Candidature introuvable." },
  { match: "User not found", status: 404, message: "Utilisateur introuvable." },
  { match: "NotFound", status: 404, message: "Introuvable." },
  { match: "Forbidden", status: 403, message: "Forbidden" },
];

/** Maps a thrown domain error to the HTTP response used across the API. */
export function handleApiError(
  error: unknown,
  options: { fallbackMessage: string; status?: number }
): NextResponse {
  const message = error instanceof Error ? error.message : "";

  if (/duplicate|unique/i.test(message)) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cette adresse email." },
      { status: 409 }
    );
  }

  for (const mapping of MAPPINGS) {
    if (message.includes(mapping.match)) {
      return NextResponse.json({ error: mapping.message }, { status: mapping.status });
    }
  }

  return NextResponse.json(
    { error: options.fallbackMessage },
    { status: options.status ?? 500 }
  );
}
