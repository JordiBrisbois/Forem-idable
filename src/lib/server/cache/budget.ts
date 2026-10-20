import { logServerEvent } from "@/lib/server/observability";
import { getRedisClient } from "@/lib/server/redis";

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const WARN_RATIO = 0.8;

interface MemoryBudget {
  dayUsed: number;
  dayResetAt: number;
  minuteUsed: number;
  minuteResetAt: number;
}

declare global {
  var __odwbBudgetMemory: MemoryBudget | undefined;
  var __odwbBudgetWarned: boolean | undefined;
}

export interface OdwbBudgetStatus {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  reason?: "daily" | "burst";
}

function limitFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  // 0 is a valid kill switch ("stop all upstream calls").
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getOdwbBudgetLimits() {
  return {
    daily: limitFromEnv("OFFERS_API_DAILY_BUDGET", 15000),
    perMinute: limitFromEnv("OFFERS_API_MAX_CALLS_PER_MINUTE", 60),
  };
}

function budgetNamespace() {
  return process.env.APP_STORAGE_NAMESPACE?.trim() || "app";
}

/** Increments a fixed-window counter and returns the new value (null on error). */
async function incrementWindow(
  key: string,
  windowMs: number
): Promise<number | null> {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    const count = await client.incr(key);
    if (count === 1) {
      await client.pExpire(key, windowMs);
    }
    return count;
  } catch {
    return null;
  }
}

function incrementMemory(): { dayUsed: number; minuteUsed: number } {
  const state = (globalThis.__odwbBudgetMemory ??= {
    dayUsed: 0,
    dayResetAt: 0,
    minuteUsed: 0,
    minuteResetAt: 0,
  });
  const now = Date.now();

  if (now >= state.dayResetAt) {
    state.dayUsed = 0;
    state.dayResetAt = now + DAY_MS;
  }
  if (now >= state.minuteResetAt) {
    state.minuteUsed = 0;
    state.minuteResetAt = now + MINUTE_MS;
  }

  state.dayUsed += 1;
  state.minuteUsed += 1;
  return { dayUsed: state.dayUsed, minuteUsed: state.minuteUsed };
}

/**
 * Reserves one ODWB API call against two ceilings: a rolling 24h budget and a
 * per-minute burst guard. Callers MUST skip the upstream request when `allowed`
 * is false and serve the cached stale value instead (or a controlled 429).
 *
 * Redis is used when available so the budget is shared and survives restarts;
 * otherwise counters live in memory (per container). Never throws.
 */
export async function reserveOdwbCall(): Promise<OdwbBudgetStatus> {
  const limits = getOdwbBudgetLimits();
  const namespace = budgetNamespace();

  let dayUsed = await incrementWindow(`${namespace}:odwb-budget:24h`, DAY_MS);
  let minuteUsed = await incrementWindow(`${namespace}:odwb-budget:1m`, MINUTE_MS);

  if (dayUsed === null || minuteUsed === null) {
    const memory = incrementMemory();
    dayUsed = memory.dayUsed;
    minuteUsed = memory.minuteUsed;
  }

  const remaining = Math.max(limits.daily - dayUsed, 0);

  if (dayUsed > limits.daily) {
    return { allowed: false, used: dayUsed, limit: limits.daily, remaining: 0, reason: "daily" };
  }

  if (minuteUsed > limits.perMinute) {
    return {
      allowed: false,
      used: dayUsed,
      limit: limits.daily,
      remaining,
      reason: "burst",
    };
  }

  if (!globalThis.__odwbBudgetWarned && dayUsed >= limits.daily * WARN_RATIO) {
    globalThis.__odwbBudgetWarned = true;
    logServerEvent({
      category: "cache",
      action: "odwb_budget_warning",
      level: "warn",
      meta: { used: dayUsed, limit: limits.daily, ratio: WARN_RATIO },
    });
  }

  return { allowed: true, used: dayUsed, limit: limits.daily, remaining };
}

/** Test helper: reset in-memory counters and the one-shot warning flag. */
export function resetOdwbBudgetForTests() {
  globalThis.__odwbBudgetMemory = undefined;
  globalThis.__odwbBudgetWarned = undefined;
}
