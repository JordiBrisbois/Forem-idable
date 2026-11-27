import type { Job } from "@/types/job";
import type { OfferDetails } from "@/types/offerDetails";

const EMPLOYMENT_TYPE: Record<string, string> = {
  CDI: "FULL_TIME",
  CDD: "TEMPORARY",
  INTERIM: "TEMPORARY",
  STAGE: "INTERN",
  ALTERNANCE: "OTHER",
  FREELANCE: "CONTRACTOR",
  AUTRE: "OTHER",
};

function toIsoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}

/** `24/12/2026` (Forem display format) or an ISO date. */
function parseForemDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const french = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (french) return `${french[3]}-${french[2]}-${french[1]}`;
  return toIsoDate(value);
}

function findHighlight(details: OfferDetails | null, label: string): string | undefined {
  return details?.highlights.find((item) => item.label === label)?.value;
}

/**
 * `JobPosting` structured data for the public offer page.
 *
 * Duplicate content with the Forem is mitigated by `directApply: false` and a
 * canonical URL on our own page: the job is described, the application happens
 * on the official site.
 */
export function buildJobPostingJsonLd(input: {
  job: Job;
  details: OfferDetails | null;
  url: string;
  description: string;
}): Record<string, unknown> {
  const { job, details, url, description } = input;
  const validThrough = parseForemDate(
    findHighlight(details, "Date de fin de diffusion")
  );
  const employmentType = EMPLOYMENT_TYPE[job.contractType] ?? "OTHER";

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    datePosted: toIsoDate(job.publicationDate),
    ...(validThrough ? { validThrough } : {}),
    employmentType,
    directApply: false,
    url,
    identifier: {
      "@type": "PropertyValue",
      name: job.source === "forem" ? "Forem" : job.source,
      value: job.id,
    },
    hiringOrganization: {
      "@type": "Organization",
      name: job.company || "Employeur non précisé",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location || "Belgique",
        addressCountry: "BE",
      },
    },
    ...(details?.sections.some((section) => section.title === "Comment postuler")
      ? {
          applicationContact: {
            "@type": "ContactPoint",
            contactType: "Recrutement",
          },
        }
      : {}),
  };
}
