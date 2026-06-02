"use client";

import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getJobExternalUrl, getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import { isManualApplication } from "@/lib/applications/sourceType";
import { JobApplication } from "@/types/application";

interface ApplicationsOfferButtonsProps {
  application: JobApplication;
  layout?: "card" | "sheet";
}

export function ApplicationsOfferButtons({
  application,
  layout = "card",
}: ApplicationsOfferButtonsProps) {
  const pdfUrl = getJobPdfUrl(application.job);
  const jobUrl = getJobExternalUrl(application.job);
  const isSheet = layout === "sheet";
  const hasWebLink = Boolean(application.job.url) && !isManualApplication(application);

  return (
    <div
      className={isSheet ? "flex flex-wrap gap-2" : "flex flex-wrap gap-2"}
      onClick={(event) => event.stopPropagation()}
    >
      {hasWebLink ? (
        <Button
          size="sm"
          asChild
          className={`h-8 gap-1 whitespace-nowrap ${isSheet ? "px-3" : "flex-1"}`}
        >
          <a
            href={jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ouvrir l'offre WEB dans un nouvel onglet — ${application.job.title}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            WEB
          </a>
        </Button>
      ) : null}
      {pdfUrl ? (
        <Button
          variant="outline"
          size="sm"
          asChild
          className={`h-8 gap-1 whitespace-nowrap ${isSheet ? "px-3" : "flex-1"}`}
        >
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ouvrir le PDF dans un nouvel onglet — ${application.job.title}`}
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </a>
        </Button>
      ) : null}
    </div>
  );
}
