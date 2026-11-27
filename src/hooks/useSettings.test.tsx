import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { useSettings } from "./useSettings";

describe("useSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts from the defaults when nothing is stored", () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual({ theme: "light", defaultSearchMode: "OR" });
    expect(result.current.isLoaded).toBe(true);
  });

  it("reads stored preferences on the first render", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.settings,
      JSON.stringify({ theme: "dark", defaultSearchMode: "AND" })
    );

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual({ theme: "dark", defaultSearchMode: "AND" });
  });

  it("persists an update and re-renders subscribers", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ theme: "dark" });
    });

    expect(result.current.settings.theme).toBe("dark");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.settings) ?? "{}")).toMatchObject({
      theme: "dark",
      defaultSearchMode: "OR",
    });
  });

  it("falls back to the defaults when the stored value is corrupt", () => {
    window.localStorage.setItem(STORAGE_KEYS.settings, "{not json");

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual({ theme: "light", defaultSearchMode: "OR" });
  });
});
