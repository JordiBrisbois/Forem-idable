const MINUTE_MS = 60 * 1000;

/**
 * Next run Aligned on a daily anchor (default 00:05 UTC, right after the ODWB
 * dataset counter resets) and repeated every `intervalMs`.
 *
 * Syncing shortly after the reset matters: the dataset cap is shared by every
 * consumer, so it is empty then and a ~250-call pass is certain to fit. A sync
 * that drifts to mid-day competes with everyone else.
 */
export function nextRunAfter(
  now: Date,
  intervalMs: number,
  anchorUtcHour = 0,
  anchorUtcMinute = 5
): Date {
  const period = Math.max(intervalMs, MINUTE_MS);
  const anchor = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    anchorUtcHour,
    anchorUtcMinute,
    0,
    0
  );

  let next = anchor;
  while (next <= now.getTime()) {
    next += period;
  }

  return new Date(next);
}
