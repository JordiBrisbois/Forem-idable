import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetOdwbBudgetForTests } from "@/lib/server/cache/budget";

vi.mock("@/lib/server/rateLimit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
}));

// The route keeps a module-level cache: reload it per test to isolate them.
async function loadGet() {
  const mod = await import("./route");
  return mod.GET;
}

describe("GET /api/offers/contract-types", () => {
  beforeEach(() => {
    vi.resetModules();
    resetOdwbBudgetForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("aggregates and normalizes the ODWB facets into contract type counts", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        facets: [
          {
            name: "typecontrat",
            facets: [
              { value: "Intérimaire avec option sur durée indéterminée", count: 10 },
              { value: "Intérimaire", count: 5 },
              { value: "Durée indéterminée", count: 7 },
              { value: "Durée déterminée", count: 3 },
              { value: "Etudiant", count: 2 },
            ],
          },
        ],
      }),
    } as Response);

    const GET = await loadGet();
    const response = await GET();
    const body = (await response.json()) as {
      types: Array<{ type: string; label: string; count: number }>;
    };

    expect(response.headers.get("x-cache")).toBe("miss");
    expect(body.types).toEqual([
      { type: "INTERIM", label: "Intérim", count: 15 },
      { type: "CDI", label: "CDI", count: 7 },
      { type: "CDD", label: "CDD", count: 3 },
    ]);
  });

  it("returns an empty list when the upstream fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({ ok: false, status: 429 } as Response);

    const GET = await loadGet();
    const response = await GET();
    await expect(response.json()).resolves.toEqual({ types: [] });
    expect(response.headers.get("x-cache")).toBe("miss");
  });

  it("returns an empty list (no upstream call) when the budget is exhausted", async () => {
    vi.stubEnv("OFFERS_API_DAILY_BUDGET", "0");
    vi.stubEnv("OFFERS_API_MAX_CALLS_PER_MINUTE", "100");

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ facets: [] }),
    } as Response);

    const GET = await loadGet();
    const response = await GET();

    await expect(response.json()).resolves.toEqual({ types: [] });
    expect(response.headers.get("x-cache")).toBe("budget");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
