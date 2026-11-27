import { runtimeConfig } from "@/config/runtime";
import { escapeHtml } from "@/lib/server/common";
import { appBaseUrl, resendFrom, sendResendEmail } from "@/lib/server/mailer";
import type { Job } from "@/types/job";

export interface JobAlertEmailInput {
  to: string;
  firstName: string;
  alertName: string;
  offers: Job[];
  totalMatching: number;
  unsubscribeToken: string;
}

export function buildUnsubscribeUrl(token: string): string {
  return `${appBaseUrl()}/api/alerts/unsubscribe?token=${encodeURIComponent(token)}`;
}

function legalFooter(): string {
  const controller = runtimeConfig.privacy?.controllerName?.trim() || runtimeConfig.app.name;
  const contact = runtimeConfig.privacy?.contactEmail?.trim();

  return [
    `Vous recevez cet email parce que vous avez créé une alerte sur ${runtimeConfig.app.name}.`,
    `Responsable de traitement : ${controller}.`,
    contact ? `Contact : ${contact}.` : "",
    "Vos données (adresse email et critères de recherche) sont conservées le temps de l'alerte ; supprimer l'alerte supprime ces données.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Daily digest for one saved search.
 *
 * Deliberately plain HTML: a job board email has to survive strict clients, and
 * every message carries the unsubscribe link and the data-controller mention
 * required under GDPR.
 */
export function buildJobAlertEmail(input: JobAlertEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const unsubscribeUrl = buildUnsubscribeUrl(input.unsubscribeToken);
  const greeting = input.firstName.trim() || "bonjour";
  const label = input.alertName.trim() || "votre recherche";

  const rows = input.offers
    .map((offer) => {
      const title = escapeHtml(offer.title);
      const company = escapeHtml(offer.company || "");
      const location = escapeHtml(offer.location);
      const url = escapeHtml(offer.url);
      return `<li style="margin-bottom:12px;"><a href="${url}" style="color:#0f62fe;font-weight:600;text-decoration:none;">${title}</a><br>${
        company ? `<span>${company}</span> · ` : ""
      }<span>${location}</span></li>`;
    })
    .join("");

  const more =
    input.totalMatching > input.offers.length
      ? `<p>${input.totalMatching - input.offers.length} autre(s) offre(s) correspondent à ${escapeHtml(label)}.</p>`
      : "";

  const subject = `${input.totalMatching} nouvelle(s) offre(s) pour « ${input.alertName || "votre recherche"} »`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h1 style="font-size: 20px; margin-bottom: 16px;">Nouvelles offres pour ${escapeHtml(label)}</h1>
      <p>Bonjour ${escapeHtml(greeting)},</p>
      <p>${input.totalMatching} offre(s) publiée(s) depuis votre dernière alerte correspondent à votre recherche :</p>
      <ul style="padding-left:18px;">${rows}</ul>
      ${more}
      <p>
        <a href="${escapeHtml(appBaseUrl())}" style="display:inline-block;background:#0f62fe;color:#fff;text-decoration:none;padding:12px 16px;border-radius:8px;font-weight:600;">
          Voir toutes les offres
        </a>
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:12px;color:#6b7280;">${escapeHtml(legalFooter())}</p>
      <p style="font-size:12px;color:#6b7280;">
        <a href="${escapeHtml(unsubscribeUrl)}" style="color:#6b7280;">Se désinscrire de cette alerte</a>
      </p>
    </div>
  `;

  const text = [
    `Nouvelles offres pour ${label}`,
    `Bonjour ${greeting},`,
    `${input.totalMatching} offre(s) correspondent à votre recherche :`,
    ...input.offers.map((offer) => `- ${offer.title} (${offer.company ? `${offer.company}, ` : ""}${offer.location}) ${offer.url}`),
    "",
    `Voir toutes les offres : ${appBaseUrl()}`,
    "",
    legalFooter(),
    `Se désinscrire : ${unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}

export async function sendJobAlertEmail(input: JobAlertEmailInput): Promise<void> {
  const { subject, html, text } = buildJobAlertEmail(input);
  await sendResendEmail({ to: input.to, subject, html, text });
}

export { resendFrom };
