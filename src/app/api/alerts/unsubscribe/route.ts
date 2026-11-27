import { NextResponse } from "next/server";
import { unsubscribeJobAlert } from "@/lib/server/alerts/repository";

export const dynamic = "force-dynamic";

function page(title: string, message: string) {
  return new NextResponse(
    `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: system-ui, -apple-system, Arial, sans-serif; margin: 0; padding: 48px 16px; background: #f8fafc; color: #0f172a; }
      main { max-width: 560px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; }
      h1 { font-size: 20px; margin: 0 0 12px; }
      p { line-height: 1.6; margin: 0 0 12px; }
      a { color: #0f62fe; }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${message}</p>
      <p><a href="/">Retour aux offres</a></p>
    </main>
  </body>
</html>`,
    {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    }
  );
}

/**
 * One-click unsubscribe from an alert email.
 *
 * No session required: the token in the link is the capability, and the action
 * is idempotent (a second click reports the same result). This is the link the
 * GDPR footer points to.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();

  if (!token) {
    return page("Lien invalide", "Ce lien de désinscription est incomplet.");
  }

  try {
    const updated = await unsubscribeJobAlert(token);
    return updated
      ? page("Alerte désactivée", "Vous ne recevrez plus d'emails pour cette recherche.")
      : page("Lien inconnu", "Cette alerte n'existe plus ou a déjà été supprimée.");
  } catch {
    return page(
      "Service indisponible",
      "La désinscription n'a pas pu être enregistrée. Réessayez dans quelques instants."
    );
  }
}
