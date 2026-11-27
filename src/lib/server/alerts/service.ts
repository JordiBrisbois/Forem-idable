import { logServerEvent } from "@/lib/server/observability";
import { isResendConfigured } from "@/lib/server/mailer";
import { searchOffers } from "@/lib/server/offers/repository";
import { sendAlertsDigestEmail, type AlertEmailSection } from "./email";
import { listDueAlerts, markJobAlertsSent, type DueAlert } from "./repository";

export interface DigestResult {
  /** Alerts evaluated. */
  considered: number;
  /** Emails sent (one per person, not per alert). */
  sent: number;
  /** Alerts with nothing new: left untouched so they are checked again. */
  empty: number;
  /** Recipients whose email failed. */
  failed: number;
}

/** Offers per alert section. Keeps the message readable and the payload small. */
const OFFERS_PER_ALERT = 5;

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
    limit: OFFERS_PER_ALERT,
    offset: 0,
  });
}

function groupByUser(alerts: DueAlert[]): Map<number, DueAlert[]> {
  const groups = new Map<number, DueAlert[]>();

  for (const alert of alerts) {
    const group = groups.get(alert.userId);
    if (group) {
      group.push(alert);
    } else {
      groups.set(alert.userId, [alert]);
    }
  }

  return groups;
}

/**
 * Sends the daily digest, **one email per person** even when they saved several
 * searches: sections are grouped, which respects the shared Resend quota and
 * keeps the inbox quiet.
 *
 * "New" means ingested after the previous send (or after creation for the first
 * one), so an offer is announced once and an alert with nothing new stays silent
 * without being marked as sent. One failing recipient never blocks the others.
 */
export async function runAlertsDigest(options: {
  now?: Date;
  sendEmail?: typeof sendAlertsDigestEmail;
} = {}): Promise<DigestResult> {
  const now = options.now ?? new Date();
  const sendEmail = options.sendEmail ?? sendAlertsDigestEmail;
  const result: DigestResult = { considered: 0, sent: 0, empty: 0, failed: 0 };

  if (!isResendConfigured()) {
    logServerEvent({ category: "alerts", action: "digest_skipped", meta: { reason: "no_resend" } });
    return result;
  }

  const due = await listDueAlerts(now);
  result.considered = due.length;

  for (const alerts of groupByUser(due).values()) {
    const sections: AlertEmailSection[] = [];
    const sentAlertIds: number[] = [];

    for (const alert of alerts) {
      try {
        const offers = await offersForAlert(alert, alert.lastSentAt ?? alert.createdAt);

        if (offers.total === 0) {
          result.empty += 1;
          continue;
        }

        sections.push({
          alertName: alert.name,
          offers: offers.jobs,
          totalMatching: offers.total,
          unsubscribeToken: alert.unsubscribeToken,
        });
        sentAlertIds.push(alert.id);
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

    if (sections.length === 0) continue;

    const recipient = alerts[0];
    try {
      await sendEmail({
        to: recipient.email,
        firstName: recipient.firstName,
        sections,
      });
      await markJobAlertsSent(sentAlertIds, now);
      result.sent += 1;
    } catch (error) {
      result.failed += 1;
      logServerEvent({
        category: "alerts",
        action: "digest_failed",
        level: "warn",
        meta: { userId: recipient.userId, error: error instanceof Error ? error.message : "unknown" },
      });
    }
  }

  logServerEvent({ category: "alerts", action: "digest_done", meta: { ...result } });
  return result;
}
