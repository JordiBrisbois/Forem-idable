import { describe, expect, it } from "vitest";
import { buildJobPostingJsonLd } from "./jobPosting";
import type { Job } from "@/types/job";
import type { OfferDetails } from "@/types/offerDetails";

const job: Job = {
  id: "2164057",
  title: "Peintre carrossier",
  company: "KONVERT",
  location: "Namur",
  contractType: "CDI",
  publicationDate: "2026-11-26T09:00:00.000Z",
  url: "https://www.leforem.be/x",
  source: "forem",
};

const details: OfferDetails = {
  source: "forem-detail-api",
  description: "Description",
  highlights: [{ label: "Date de fin de diffusion", value: "24/12/2026" }],
  sections: [],
};

describe("buildJobPostingJsonLd", () => {
  it("describes the offer in schema.org terms", () => {
    const jsonLd = buildJobPostingJsonLd({
      job,
      details,
      url: "https://forem.example/offres/2164057",
      description: "Peinture automobile",
    });

    expect(jsonLd).toMatchObject({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: "Peintre carrossier",
      datePosted: "2026-11-26",
      validThrough: "2026-12-24",
      employmentType: "FULL_TIME",
      directApply: false,
      url: "https://forem.example/offres/2164057",
      hiringOrganization: { "@type": "Organization", name: "KONVERT" },
      jobLocation: {
        "@type": "Place",
        address: { addressLocality: "Namur", addressCountry: "BE" },
      },
    });
  });

  it("maps the Belgian contract labels to schema.org employment types", () => {
    const typeFor = (contractType: string) =>
      buildJobPostingJsonLd({ job: { ...job, contractType }, details, url: "u", description: "d" })
        .employmentType;

    expect(typeFor("CDD")).toBe("TEMPORARY");
    expect(typeFor("INTERIM")).toBe("TEMPORARY");
    expect(typeFor("STAGE")).toBe("INTERN");
    expect(typeFor("FREELANCE")).toBe("CONTRACTOR");
    expect(typeFor("AUTRE")).toBe("OTHER");
  });

  it("omits validThrough when the end date is unknown", () => {
    const jsonLd = buildJobPostingJsonLd({
      job,
      details: { ...details, highlights: [] },
      url: "u",
      description: "d",
    });

    expect(jsonLd).not.toHaveProperty("validThrough");
  });

  it("falls back to a readable employer and place", () => {
    const jsonLd = buildJobPostingJsonLd({
      job: { ...job, company: "", location: "" },
      details: null,
      url: "u",
      description: "d",
    });

    expect(jsonLd).toMatchObject({
      hiringOrganization: { name: "Employeur non précisé" },
      jobLocation: { address: { addressLocality: "Belgique" } },
    });
  });
});
