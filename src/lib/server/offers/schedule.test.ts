import { describe, expect, it } from "vitest";
import { nextRunAfter } from "./schedule";

const HOUR = 60 * 60 * 1000;
const INTERVAL = 12 * HOUR;

describe("nextRunAfter", () => {
  it("targets the anchor later the same day", () => {
    const now = new Date(Date.UTC(2026, 10, 25, 22, 30));
    expect(nextRunAfter(now, INTERVAL).toISOString()).toBe("2026-11-26T00:05:00.000Z");
  });

  it("rolls to the next interval when the anchor has passed", () => {
    const now = new Date(Date.UTC(2026, 10, 26, 0, 10));
    expect(nextRunAfter(now, INTERVAL).toISOString()).toBe("2026-11-26T12:05:00.000Z");
  });

  it("wraps to the next day after the last slot", () => {
    const now = new Date(Date.UTC(2026, 10, 26, 12, 10));
    expect(nextRunAfter(now, INTERVAL).toISOString()).toBe("2026-11-27T00:05:00.000Z");
  });

  it("honours a custom anchor and a daily interval", () => {
    const now = new Date(Date.UTC(2026, 10, 26, 3, 0));
    expect(nextRunAfter(now, 24 * HOUR, 6, 15).toISOString()).toBe("2026-11-26T06:15:00.000Z");
  });

  it("always returns a future instant", () => {
    const now = new Date(Date.UTC(2026, 10, 26, 0, 5, 0));
    expect(nextRunAfter(now, INTERVAL).getTime()).toBeGreaterThan(now.getTime());
  });
});
