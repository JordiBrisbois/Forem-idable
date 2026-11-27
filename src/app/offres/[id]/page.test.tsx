import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getOfferJob, getOfferDetail } = vi.hoisted(() => ({
  getOfferJob: vi.fn(),
  getOfferDetail: vi.fn(),
}));

vi.mock("@/lib/server/offers/repository", () => ({ getOfferJob }));
vi.mock("@/lib/server/offers/detailService", () => ({ getOfferDetail }));

import OfferPage, { generateMetadata } from "./page";

const job = {
  id: "2164057",
  title: "Peintre carrossier (H/F/X)",
  company: "KONVERT",
  location: "Namur",
  contractType: "CDI",
  publicationDate: "2026-11-26T09:00:00.000Z",
  url: "https://www.leforem.be/recherche-offres/offre-detail/2164057",
  description: "Peinture industrielle",
  source: "forem" as const,
};

const details = {
  source: "forem-detail-api" as const,
  description: "Description complète de l'offre.",
  highlights: [{ label: "Employeur", value: "KONVERT" }],
  sections: [{ title: "Comment postuler", content: "Envoyez votre CV." }],
};

function params(id = "2164057") {
  return { params: Promise.resolve({ id }) };
}

describe("offer page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOfferJob.mockResolvedValue(job);
    getOfferDetail.mockResolvedValue(details);
  });

  it("renders the offer, its detail and the apply link", async () => {
    const page = await OfferPage(params());
    render(page);

    expect(screen.getByRole("heading", { level: 1, name: job.title })).toBeVisible();
    expect(screen.getByText("Description complète de l'offre.")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Comment postuler" })).toBeVisible();
    expect(screen.getByRole("link", { name: /postuler sur le forem/i })).toHaveAttribute(
      "href",
      expect.stringContaining("leforem.be")
    );
    expect(screen.getByRole("link", { name: /revenir à la recherche/i })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("exposes JobPosting structured data", async () => {
    render(await OfferPage(params()));

    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const jsonLd = JSON.parse(script?.textContent ?? "{}");

    expect(jsonLd).toMatchObject({
      "@type": "JobPosting",
      title: job.title,
      directApply: false,
    });
  });

  it("404s when the offer is unknown", async () => {
    getOfferJob.mockResolvedValue(null);
    getOfferDetail.mockResolvedValue(null);

    await expect(OfferPage(params("999"))).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK|404/i);
  });

  it("builds metadata with a canonical URL and a truncated description", async () => {
    const metadata = await generateMetadata(params());

    expect(metadata.title).toContain(job.title);
    expect(metadata.alternates?.canonical).toMatch(/\/offres\/2164057$/);
    expect(String(metadata.description).length).toBeLessThanOrEqual(156);
  });

  it("asks robots not to index an unknown offer", async () => {
    getOfferJob.mockResolvedValue(null);

    const metadata = await generateMetadata(params("999"));

    expect(metadata.robots).toMatchObject({ index: false });
  });
});
