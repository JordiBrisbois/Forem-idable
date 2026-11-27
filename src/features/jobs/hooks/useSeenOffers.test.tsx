import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { resetSeenOffersForTests, useSeenOffers } from "./useSeenOffers";

const STORAGE_KEY = "forem_idable_seen_offers";

describe("useSeenOffers", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetSeenOffersForTests();
  });

  it("starts empty", () => {
    const { result } = renderHook(() => useSeenOffers());

    expect(result.current.seen.size).toBe(0);
  });

  it("remembers an opened offer across mounts", () => {
    const first = renderHook(() => useSeenOffers());

    act(() => {
      first.result.current.markSeen("42");
    });

    expect(first.result.current.seen.has("42")).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")).toEqual(["42"]);

    const second = renderHook(() => useSeenOffers());
    expect(second.result.current.seen.has("42")).toBe(true);
  });

  it("does not duplicate an offer already seen", () => {
    const { result } = renderHook(() => useSeenOffers());

    act(() => {
      result.current.markSeen("42");
      result.current.markSeen("42");
    });

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")).toEqual(["42"]);
  });

  it("ignores a corrupt stored list", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([1, "ok", null]));

    const { result } = renderHook(() => useSeenOffers());

    expect([...result.current.seen]).toEqual(["ok"]);
  });
});
