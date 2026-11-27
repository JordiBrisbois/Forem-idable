import { logServerEvent } from "@/lib/server/observability";
import { isResendConfigured } from "@/lib/server/mailer";
import { searchOffers } from "@/lib/server/offers/repository";
import { sendJobAlertEmail } from "./email";
import { listDueAlerts, markJobAlertSent, type DueAlert } from "./repository";

export interface DigestResult {
  considered: number;
  sent: number;
  empty: number;
  failed: number;
}

/** Offers per email. Keeps the message readable and the Resend payload small. */
const OFFERS_PER_EMAIL = 8;

async function offersForAlert(alert: DueAlert, since: Date) {
  return searchOffers({
    keywords: alert.keywords,
    locations: alert.locations,
    booleanMode: alert.booleanMode,
    goal: alert.goal,
    contractTypes: alert.contractTypes,
    regimes: alert.regimes,
    sectors: alert.sectors,
    languages: alert.languages,
    sort: "date",
    firstSeenAfter: since,
    limit: OFFERS_PER_EMAIL,
    offset: 0,
  });
}

/**
 * Sends the daily digest for every due alert.
 *
 * "New" means ingested after the previous send (or after creation for the first
 * one), so an offer is announced once and an alert with nothing new stays quiet
 * without marking itself as sent. One failing recipient never blocks the others.
 */
export async function runAlertsDigest(options: {
  now?: Date;
  sendEmail?: typeof sendJobAlertEmail;
} = {}): Promise<DigestResult> {
  const now = options.now ?? new Date();
  const sendEmail = options.sendEmail ?? sendJobAlertEmail;
  const result: DigestResult = { considered: 0, sent: 0, empty: 0, failed: 0 };

  if (!isResendConfigured()) {
    logServerEvent({ category: "alerts", action: "digest_skipped", meta: { reason: "no_resend" } });
    return result;
  }

  const due = await listDueAlerts(now);
  result.considered = due.length;

  for (const alert of due) {
    const since = alert.lastSentAt ?? alert.createdAt;

    try {
      const offers = await offersForAlert(alert, since);
      if (offers.total === 0) {
        result.empty += 1;
        continue;
      }

      await sendEmail({
        to: alert.email,
        firstName: alert.firstName,
        alertName: alert.name,
        offers: offers.jobs,
        totalMatching: offers.total,
        unsubscribeToken: alert.unsubscribeToken,
      });

      await markJobAlertSent(alert.id, now);
      result.sent += 1;
    } catch (error) {
      result.failed += 1;
      logServerEvent({
        category: "alerts",
        action: "digest_failed",
        level: "warn",
        meta: { alertId: alert.id, error: error instanceof Error ? error.message : "unknown" },
      });
    }
  }

  logServerEvent({ category: "alerts", action: "digest_done", meta: { ...result } });
  return result;
}
