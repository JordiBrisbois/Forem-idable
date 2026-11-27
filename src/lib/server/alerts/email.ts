import { runtimeConfig } from "@/config/runtime";
import { escapeHtml } from "@/lib/server/common";
import { appBaseUrl, resendFrom, sendResendEmail } from "@/lib/server/mailer";
import type { Job } from "@/types/job";

export interface AlertEmailSection {
  alertName: string;
  offers: Job[];
  totalMatching: number;
  unsubscribeToken: string;
}

export interface AlertsDigestEmailInput {
  to: string;
  firstName: string;
  sections: AlertEmailSection[];
}

export function buildUnsubscribeUrl(token: string): string {
  return `${appBaseUrl()}/api/alerts/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function buildManageAlertsUrl(): string {
  return `${appBaseUrl()}/account#alertes`;
}

function legalFooter(): string {
  const controller = runtimeConfig.privacy?.controllerName?.trim() || runtimeConfig.app.name;
  const contact = runtimeConfig.privacy?.contactEmail?.trim();

  return [
    `Vous recevez cet email parce que vous avez créé une ou plusieurs alertes sur ${runtimeConfig.app.name}.`,
    "Un seul email par jour regroupe toutes vos alertes.",
    `Responsable de traitement : ${controller}.`,
    contact ? `Contact : ${contact}.` : "",
    "Vos données (adresse email et critères de recherche) sont conservées le temps des alertes ; supprimer une alerte supprime ces données.",
  ]
    .filter(Boolean)
    .join(" ");
}

function offersList(offers: Job[]): string {
  return offers
    .map((offer) => {
      const title = escapeHtml(offer.title);
      const company = escapeHtml(offer.company || "");
      const location = escapeHtml(offer.location);
      const url = escapeHtml(offer.url);
      return `<li style="margin-bottom:10px;"><a href="${url}" style="color:#0f62fe;font-weight:600;text-decoration:none;">${title}</a><br>${
        company ? `<span>${company}</span> · ` : ""
      }<span>${location}</span></li>`;
    })
    .join("");
}

function sectionHtml(section: AlertEmailSection): string {
  const label = section.alertName.trim() || "Votre recherche";
  const remaining = section.totalMatching - section.offers.length;
  const more =
    remaining > 0 ? `<p>${remaining} autre(s) offre(s) correspondent à cette alerte.</p>` : "";

  return `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:16px;margin:0 0 8px;">${escapeHtml(label)}</h2>
      <ul style="padding-left:18px;margin:0;">${offersList(section.offers)}</ul>
      ${more}
      <p style="font-size:12px;color:#6b7280;margin-top:8px;">
        <a href="${escapeHtml(buildUnsubscribeUrl(section.unsubscribeToken))}" style="color:#6b7280;">
          Se désinscrire de cette alerte
        </a>
      </p>
    </div>
  `;
}

function subjectFor(sections: AlertEmailSection[]): string {
  const total = sections.reduce((sum, section) => sum + section.totalMatching, 0);

  if (sections.length === 1) {
    const label = sections[0].alertName.trim();
    return label
      ? `${total} nouvelle(s) offre(s) pour « ${label} »`
      : `${total} nouvelle(s) offre(s) pour votre recherche`;
  }

  return `${total} nouvelle(s) offre(s) pour vos ${sections.length} alertes`;
}

/**
 * Daily digest for every saved search of one person.
 *
 * One email per recipient per day, with a section per alert: it respects the
 * shared Resend quota (100 emails/day), spares the inbox, and keeps the
 * unsubscribe link next to each alert as well as a management link in the
 * footer.
 */
export function buildAlertsDigestEmail(input: AlertsDigestEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const greeting = input.firstName.trim() || "bonjour";
  const subject = subjectFor(input.sections);
  const manageUrl = buildManageAlertsUrl();

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h1 style="font-size: 20px; margin-bottom: 16px;">Nouvelles offres pour vos alertes</h1>
      <p>Bonjour ${escapeHtml(greeting)},</p>
      <p>${input.sections.length > 1 ? `Voici les nouveautés de vos ${input.sections.length} alertes :` : "Voici les nouveautés de votre alerte :"}</p>
      ${input.sections.map(sectionHtml).join("")}
      <p>
        <a href="${escapeHtml(appBaseUrl())}" style="display:inline-block;background:#0f62fe;color:#fff;text-decoration:none;padding:12px 16px;border-radius:8px;font-weight:600;">
          Voir toutes les offres
        </a>
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:12px;color:#6b7280;">${escapeHtml(legalFooter())}</p>
      <p style="font-size:12px;color:#6b7280;">
        <a href="${escapeHtml(manageUrl)}" style="color:#6b7280;">Gérer toutes mes alertes</a>
      </p>
    </div>
  `;

  const text = [
    "Nouvelles offres pour vos alertes",
    `Bonjour ${greeting},`,
    "",
    ...input.sections.flatMap((section) => [
      `## ${section.alertName.trim() || "Votre recherche"} (${section.totalMatching})`,
      ...section.offers.map(
        (offer) =>
          `- ${offer.title} (${offer.company ? `${offer.company}, ` : ""}${offer.location}) ${offer.url}`
      ),
      section.totalMatching > section.offers.length
        ? `${section.totalMatching - section.offers.length} autre(s) offre(s) pour cette alerte.`
        : "",
      `Se désinscrire de cette alerte : ${buildUnsubscribeUrl(section.unsubscribeToken)}`,
      "",
    ]),
    `Voir toutes les offres : ${appBaseUrl()}`,
    "",
    legalFooter(),
    `Gérer toutes mes alertes : ${manageUrl}`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { subject, html, text };
}

export async function sendAlertsDigestEmail(input: AlertsDigestEmailInput): Promise<void> {
  const { subject, html, text } = buildAlertsDigestEmail(input);
  await sendResendEmail({ to: input.to, subject, html, text });
}

export { resendFrom };
