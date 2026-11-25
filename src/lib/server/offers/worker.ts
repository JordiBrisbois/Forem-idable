import { logServerEvent } from "@/lib/server/observability";
import { runOffersSync } from "./sync";

const DEFAULT_INTERVAL_HOURS = 6;
const DEFAULT_RETRY_MINUTES = 10;
const MINUTE_MS = 60 * 1000;

declare global {
  var __offersSyncTimer: ReturnType<typeof setTimeout> | undefined;
  var __offersSyncInFlight: boolean | undefined;
}

function positiveEnv(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

function intervalMs(): number {
  return positiveEnv("OFFERS_SYNC_INTERVAL_HOURS", DEFAULT_INTERVAL_HOURS) * 60 * MINUTE_MS;
}

function retryMs(): number {
  return positiveEnv("OFFERS_SYNC_RETRY_MINUTES", DEFAULT_RETRY_MINUTES) * MINUTE_MS;
}

/**
 * Keeps the offers mirror fresh.
 *
 * Opt-out (`OFFERS_SYNC_ENABLED=0`) rather than opt-in: search reads only the
 * mirror, so an instance that never syncs has an empty search.
 *
 * A failed run keeps the existing rows and retries soon (10 minutes by default)
 * instead of waiting for the full interval: the usual failure is the upstream
 * dataset quota, which resets daily, and an empty mirror would leave search
 * broken for hours.
 */
export function startOffersSyncWorker(): void {
  if (process.env.NODE_ENV === "test" || process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }
  if (process.env.OFFERS_SYNC_ENABLED === "0") {
    logServerEvent({ category: "offers", action: "sync_worker_disabled" });
    return;
  }
  if (globalThis.__offersSyncTimer) {
    return;
  }

  const schedule = (delayMs: number) => {
    globalThis.__offersSyncTimer = setTimeout(() => void tick(), delayMs);
    globalThis.__offersSyncTimer.unref?.();
  };

  const tick = async () => {
    if (globalThis.__offersSyncInFlight) {
      schedule(retryMs());
      return;
    }
    globalThis.__offersSyncInFlight = true;

    try {
      const result = await runOffersSync();
      logServerEvent({ category: "offers", action: "sync_tick_done", meta: { ...result } });
      schedule(intervalMs());
    } catch (error) {
      logServerEvent({
        category: "offers",
        action: "sync_tick_failed",
        level: "warn",
        meta: {
          error: error instanceof Error ? error.message : "unknown",
          retryInMinutes: retryMs() / MINUTE_MS,
        },
      });
      schedule(retryMs());
    } finally {
      globalThis.__offersSyncInFlight = false;
    }
  };

  // First run at boot: the mirror may be empty on a fresh instance.
  void tick();

  logServerEvent({
    category: "offers",
    action: "sync_worker_started",
    meta: {
      intervalHours: intervalMs() / (60 * MINUTE_MS),
      retryMinutes: retryMs() / MINUTE_MS,
    },
  });
}

/** Test helper. */
export function stopOffersSyncWorkerForTests(): void {
  if (globalThis.__offersSyncTimer) {
    clearTimeout(globalThis.__offersSyncTimer);
    globalThis.__offersSyncTimer = undefined;
  }
}
