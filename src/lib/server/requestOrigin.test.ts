import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";

describe("rejectCrossOriginRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a request matching APP_BASE_URL through the Origin header", () => {
    vi.stubEnv("APP_BASE_URL", "https://forem.brisbois.dev");

    const request = new NextRequest("https://forem.brisbois.dev/api/auth/login", {
      method: "POST",
      headers: {
        origin: "https://forem.brisbois.dev",
      },
    });

    expect(rejectCrossOriginRequest(request)).toBeNull();
  });

  it("rejects a request from a different Origin", async () => {
    vi.stubEnv("APP_BASE_URL", "https://forem.brisbois.dev");

    const request = new NextRequest("https://forem.brisbois.dev/api/auth/login", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
      },
    });

    const response = rejectCrossOriginRequest(request);
    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toEqual({ error: "Requête interdite." });
  });

  it("accepts same-site requests without Origin when sec-fetch-site is same-origin", () => {
    vi.stubEnv("APP_BASE_URL", "https://forem.brisbois.dev");

    const request = new NextRequest("https://forem.brisbois.dev/api/auth/logout", {
      method: "POST",
      headers: {
        "sec-fetch-site": "same-origin",
      },
    });

    expect(rejectCrossOriginRequest(request)).toBeNull();
  });

  it("rejects cross-site requests without Origin", async () => {
    vi.stubEnv("APP_BASE_URL", "https://forem.brisbois.dev");

    const request = new NextRequest("https://forem.brisbois.dev/api/auth/logout", {
      method: "POST",
      headers: {
        "sec-fetch-site": "cross-site",
      },
    });

    const response = rejectCrossOriginRequest(request);
    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toEqual({ error: "Requête interdite." });
  });

  it("rejects requests missing both Origin metadata and sec-fetch-site", async () => {
    vi.stubEnv("APP_BASE_URL", "https://forem.brisbois.dev");

    const request = new NextRequest("https://forem.brisbois.dev/api/auth/logout", {
      method: "POST",
    });

    const response = rejectCrossOriginRequest(request);
    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toEqual({ error: "Requête interdite." });
  });

  it("falls back to forwarded host when APP_BASE_URL is absent", () => {
    const request = new NextRequest("http://internal/api/auth/login", {
      method: "POST",
      headers: {
        origin: "https://forem.brisbois.dev",
        "x-forwarded-proto": "https",
        "x-forwarded-host": "forem.brisbois.dev",
      },
    });

    expect(rejectCrossOriginRequest(request)).toBeNull();
  });
});
