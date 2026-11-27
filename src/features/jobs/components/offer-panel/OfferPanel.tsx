"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  SheetPanel,
  SheetPanelBody,
  SheetPanelFooter,
  SheetPanelHeader,
} from "@/components/ui/sheet-panel";
import { ContractTypeBadge } from "@/components/jobs/ContractTypeBadge";
import { JobDetailsActions } from "@/features/jobs/components/JobDetailsActions";
import {
  OfferDetailSkeleton,
  OfferDetailView,
} from "@/features/jobs/components/offer-panel/OfferDetailView";
import { buildOfferMailtoLink } from "@/features/jobs/utils/shareOfferMail";
import { getForemOfferId, getJobExternalUrl, getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import type { Job } from "@/types/job";
import type { OfferDetails } from "@/types/offerDetails";

interface OfferPanelProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: OfferDetails | null;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
  applied: boolean;
  isAuthenticated: boolean;
  isApplicationsLoaded: boolean;
  onTrackApplication: (job: Job) => Promise<void> | void;
  onRequireAuth?: () => void;
}

/**
 * Offer panel shell: header that stays, scrollable body, sticky actions.
 *
 * The content lives in `OfferDetailView` so the public page renders exactly the
 * same text; this component only owns the surrounding chrome.
 */
export function OfferPanel({
  job,
  open,
  onOpenChange,
  details,
  status,
  error,
  applied,
  isAuthenticated,
  isApplicationsLoaded,
  onTrackApplication,
  onRequireAuth,
}: OfferPanelProps) {
  if (!job) return null;

  const publicationLabel = job.publicationDate
    ? format(new Date(job.publicationDate), "dd MMM yyyy", { locale: fr })
    : "N/A";
  const foremId = getForemOfferId(job);
  const pageUrl = foremId ? `/offres/${foremId}` : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPanel size="xl" aria-label={`Offre : ${job.title}`}>
        <SheetPanelHeader>
          <SheetTitle className="text-lg leading-snug">{job.title}</SheetTitle>
          <SheetDescription className="text-sm">
            {job.company || "Entreprise non précisée"} • {job.location}
          </SheetDescription>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <ContractTypeBadge contractType={job.contractType} />
            <Badge variant="secondary">{job.source.toUpperCase()}</Badge>
            <Badge variant="outline">Publiée le {publicationLabel}</Badge>
            {pageUrl ? (
              <Button asChild variant="ghost" size="sm" className="ml-auto h-8">
                <a href={pageUrl} target="_blank" rel="noreferrer">
                  <ExternalLink data-icon="inline-start" />
                  Ouvrir dans un onglet
                </a>
              </Button>
            ) : null}
          </div>
        </SheetPanelHeader>

        <SheetPanelBody>
          {status === "loading" ? (
            <OfferDetailSkeleton />
          ) : status === "error" ? (
            <div className="flex flex-col gap-3">
              <OfferDetailView
                job={job}
                details={details ? { ...details, description: undefined } : null}
              />
              <p className="text-xs text-muted-foreground">
                {error ?? "Le détail complet n'a pas pu être chargé."}
              </p>
            </div>
          ) : (
            <OfferDetailView job={job} details={details} />
          )}
        </SheetPanelBody>

        <SheetPanelFooter>
          <JobDetailsActions
            job={job}
            mailtoHref={buildOfferMailtoLink(job, publicationLabel)}
            pdfUrl={getJobPdfUrl(job)}
            jobUrl={getJobExternalUrl(job)}
            applied={applied}
            isAuthenticated={isAuthenticated}
            isApplicationsLoaded={isApplicationsLoaded}
            onTrackApplication={onTrackApplication}
            onRequireAuth={onRequireAuth}
          />
        </SheetPanelFooter>
      </SheetPanel>
    </Sheet>
  );
}
