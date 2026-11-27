import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { facetsState, mirrorState } = vi.hoisted(() => ({
  facetsState: {
    facets: { regimes: [], sectors: [], languages: [] },
    isLoading: false,
  },
  mirrorState: null as null | {
    offers: number;
    lastSyncAt: string;
    lastSyncStatus: string;
    ageMinutes: number;
    stale: boolean;
    newOffers: number | null;
  },
}));

vi.mock("@/features/jobs/hooks/useOfferFacets", () => ({
  useOfferFacets: () => facetsState,
}));
vi.mock("@/features/jobs/hooks/useMirrorStatus", () => ({
  useMirrorStatus: () => mirrorState,
  formatFreshness: (minutes: number | null) => (minutes === null ? "date inconnue" : `il y a ${minutes} min`),
}));

import { SearchFiltersBar } from "./SearchFiltersBar";
import type { LocationEntry } from "@/services/location/locationCache";
import { DEFAULT_SEARCH_VIEW } from "@/types/search";

const namur: LocationEntry = { id: "namur", name: "Namur", type: "Communes", postalCode: "5000" };

function renderBar(overrides: Partial<Parameters<typeof SearchFiltersBar>[0]> = {}) {
  return render(
    <SearchFiltersBar
      sort="date"
      onSortChange={vi.fn()}
      filters={DEFAULT_SEARCH_VIEW.filters}
      onFiltersChange={vi.fn()}
      hasKeywords={false}
      locations={[]}
      {...overrides}
    />
  );
}

describe("SearchFiltersBar", () => {
  it("names the place the distance will be computed from", () => {
    renderBar({ locations: [namur] });

    expect(screen.getByRole("button", { name: /autour de namur/i })).toBeInTheDocument();
  });

  it("falls back to the device position when no place is selected", () => {
    renderBar();

    expect(screen.getByRole("button", { name: /autour de moi/i })).toBeInTheDocument();
  });

  it("centres on the selected place instead of the device", async () => {
    const onNearChange = vi.fn();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ lat: 50.47, lon: 4.87, offers: 120 }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    renderBar({ locations: [namur], onNearChange });

    fireEvent.click(screen.getByRole("button", { name: /autour de namur/i }));

    await vi.waitFor(() =>
      expect(onNearChange).toHaveBeenCalledWith({ lat: 50.47, lon: 4.87, radiusKm: 25 })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/offers/centroid?name=Namur&postalCode=5000"),
      expect.anything()
    );

    vi.unstubAllGlobals();
  });

  it("explains why relevance needs a keyword", () => {
    renderBar({ sort: "relevance", hasKeywords: false });

    expect(screen.getByText(/la pertinence classe les offres selon vos mots-clés/i)).toBeVisible();
  });

  it("does not nag once keywords exist", () => {
    renderBar({ sort: "relevance", hasKeywords: true });

    expect(screen.queryByText(/la pertinence classe les offres/i)).toBeNull();
  });
});
