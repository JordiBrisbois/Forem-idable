import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBrowserStore } from "./browserStore";

interface Prefs {
  theme: "light" | "dark";
  pageSize: number;
}

const DEFAULTS: Prefs = { theme: "light", pageSize: 15 };

function buildStore(key = "test-prefs") {
  return createBrowserStore<Prefs>({
    key,
    defaultValue: DEFAULTS,
    parse: (raw) => ({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) }),
  });
}

describe("createBrowserStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns the default when nothing is stored", () => {
    const store = buildStore();

    expect(store.read()).toEqual(DEFAULTS);
  });

  it("reads what was written, without a round trip through React", () => {
    const store = buildStore();

    store.write({ theme: "dark", pageSize: 50 });

    expect(store.read()).toEqual({ theme: "dark", pageSize: 50 });
    expect(JSON.parse(window.localStorage.getItem("test-prefs") ?? "null")).toEqual({
      theme: "dark",
      pageSize: 50,
    });
  });

  it("keeps a stable snapshot identity between reads", () => {
    const store = buildStore();
    store.write({ theme: "dark", pageSize: 15 });

    expect(store.read()).toBe(store.read());
  });

  it("falls back to the default on corrupt JSON", () => {
    window.localStorage.setItem("test-prefs", "{not json");

    expect(buildStore().read()).toEqual(DEFAULTS);
  });

  it("notifies subscribers on a same-tab write", () => {
    const store = buildStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.update((current) => ({ ...current, pageSize: 25 }));

    expect(listener).toHaveBeenCalledOnce();
    expect(store.read().pageSize).toBe(25);

    unsubscribe();
    store.write({ theme: "light", pageSize: 15 });
    expect(listener).toHaveBeenCalledOnce();
  });

  it("notifies on a storage event coming from another tab", () => {
    const store = buildStore();
    const listener = vi.fn();
    store.subscribe(listener);

    window.dispatchEvent(new StorageEvent("storage", { key: "test-prefs" }));

    expect(listener).toHaveBeenCalledOnce();
  });
});
