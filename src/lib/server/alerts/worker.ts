import { logServerEvent } from "@/lib/server/observability";
import { nextRunAfter } from "@/lib/server/offers/schedule";
import { runAlertsDigest } from "./service";

const DEFAULT_UTC_HOUR = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

declare global {
  var __alertsTimer: ReturnType<typeof setTimeout> | undefined;
}


function digestHour(): number {
  const hour = Number(process.env.JOB_ALERTS_UTC_HOUR);
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : DEFAULT_UTC_HOUR;
}

/**
 * Daily alert digest.
 *
 * Anchored on a UTC hour (08:00 by default) so it does not depend on when the
 * container happened to boot. Opt-out with `JOB_ALERTS_ENABLED=0`; without a
 * Resend key the service logs a skip and does nothing.
 */
export function startAlertsWorker(): void {
  if (process.env.NODE_ENV === "test" || process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }
  if (process.env.JOB_ALERTS_ENABLED === "0") {
    logServerEvent({ category: "alerts", action: "worker_disabled" });
    return;
  }
  if (globalThis.__alertsTimer) return;

  const scheduleNext = () => {
    const next = nextRunAfter(new Date(), DAY_MS, digestHour(), 0);
    globalThis.__alertsTimer = setTimeout(() => void tick(), Math.max(next.getTime() - Date.now(), 1000));
    globalThis.__alertsTimer.unref?.();
  };

  const tick = async () => {
    try {
      await runAlertsDigest();
    } catch (error) {
      logServerEvent({
        category: "alerts",
        action: "digest_crashed",
        level: "warn",
        meta: { error: error instanceof Error ? error.message : "unknown" },
      });
    } finally {
      scheduleNext();
    }
  };

  scheduleNext();
  logServerEvent({
    category: "alerts",
    action: "worker_started",
    meta: { utcHour: digestHour() },
  });
}

/** Test helper. */
export function stopAlertsWorkerForTests(): void {
  if (globalThis.__alertsTimer) {
    clearTimeout(globalThis.__alertsTimer);
    globalThis.__alertsTimer = undefined;
  }
}
