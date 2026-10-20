import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryCacheStore } from "./memory";
import { cachedResource, resetInFlightForTests } from "./cached";

const options = { ttlMs: 60_000, staleTtlMs: 120_000 };

describe("cachedResource", () => {
  beforeEach(() => {
    resetInFlightForTests();
  });

  it("serves a fresh hit without calling the loader again", async () => {
    const store = new MemoryCacheStore(10);
    const loader = vi.fn(async () => ({ ok: true as const, value: "v1" }));

    const first = await cachedResource(store, "k1", options, loader);
    const second = await cachedResource(store, "k1", options, loader);

    expect(first).toMatchObject({ ok: true, source: "miss", value: "v1" });
    expect(second).toMatchObject({ ok: true, source: "hit", value: "v1" });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("serves the stale value when the loader fails", async () => {
    const store = new MemoryCacheStore(10);
    // ttl 0 => immediately stale, staleTtl keeps it available.
    const staleOptions = { ttlMs: 0, staleTtlMs: 60_000 };

    await cachedResource(store, "k2", staleOptions, async () => ({
      ok: true as const,
      value: "old",
    }));

    // Let the fresh window (ttl 0) elapse so the entry becomes stale.
    await new Promise((resolve) => setTimeout(resolve, 5));

    const result = await cachedResource(store, "k2", staleOptions, async () => ({
      ok: false as const,
      status: 429,
      reason: "budget" as const,
    }));

    expect(result).toMatchObject({ ok: true, source: "stale", value: "old" });
  });

  it("propagates the failure when there is no stale value", async () => {
    const store = new MemoryCacheStore(10);

    const result = await cachedResource(store, "k3", options, async () => ({
      ok: false as const,
      status: 503,
      body: "nope",
    }));

    expect(result).toMatchObject({ ok: false, status: 503, body: "nope" });
  });

  it("collapses concurrent misses into a single loader call", async () => {
    const store = new MemoryCacheStore(10);
    let resolveLoader: ((value: { ok: true; value: string }) => void) | undefined;
    const loader = vi.fn(
      () =>
        new Promise<{ ok: true; value: string }>((resolve) => {
          resolveLoader = resolve;
        })
    );

    const first = cachedResource(store, "k4", options, loader);
    const second = cachedResource(store, "k4", options, loader);

    // Let both calls pass the initial cache lookup and register the flight.
    await new Promise((resolve) => setTimeout(resolve, 0));
    resolveLoader?.({ ok: true, value: "v4" });

    const results = await Promise.all([first, second]);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(results[0]).toMatchObject({ ok: true, value: "v4" });
    expect(results[1]).toMatchObject({ ok: true, value: "v4" });
  });

  it("evicts the oldest entry beyond the cap", async () => {
    const store = new MemoryCacheStore(2);

    await store.set("a", 1, options);
    await store.set("b", 2, options);
    await store.set("c", 3, options);

    expect(await store.get("a")).toEqual({ state: "miss" });
    expect((await store.get("c")).state).toBe("fresh");
  });
});
