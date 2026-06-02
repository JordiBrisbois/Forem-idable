"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Job } from "@/types/job";
import {
  ExternalLink,
  FileText,
  MessagesSquare,
  Send,
} from "lucide-react";
import { getJobExternalUrl, getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import { formatPublicationDateCompact } from "./jobTableUtils";

interface JobActionsProps {
  job: Job;
  layout: "table" | "mobile";
  isSelected: boolean;
  isAuthenticated: boolean;
  isApplicationsLoaded: boolean;
  isApplied: boolean;
  onToggleSelection?: (job: Job) => void;
  onTrackApplication?: (job: Job) => Promise<void> | void;
  onRequireAuth?: (job: Job) => void;
  onOpenDetails?: (job: Job) => void;
  onShareJob?: (job: Job) => void;
}

export function JobActions({
  job,
  layout,
  isSelected,
  isAuthenticated,
  isApplicationsLoaded,
  isApplied,
  onToggleSelection,
  onTrackApplication,
  onRequireAuth,
  onOpenDetails,
  onShareJob,
}: JobActionsProps) {
  const jobUrl = getJobExternalUrl(job);
  const pdfUrl = getJobPdfUrl(job);

  const handleTrackApplication = async () => {
    if (!isAuthenticated) {
      onRequireAuth?.(job);
      return;
    }
    await onTrackApplication?.(job);
  };

  if (layout === "mobile") {
    return (
      <div
        className="flex flex-col gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          {onToggleSelection ? (
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelection(job)}
                className="size-4 rounded border-border"
                aria-label="Sélectionner pour comparer"
              />
              Comparer
            </label>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground">
            {formatPublicationDateCompact(job.publicationDate)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={isApplied ? "secondary" : "default"}
            className="col-span-2 h-11 w-full"
            onClick={handleTrackApplication}
            disabled={!isApplicationsLoaded}
          >
            <Send
              data-icon="inline-start"
              className={isApplied ? "fill-current" : undefined}
            />
            {isApplied ? "Déjà dans le suivi" : "Ajouter au suivi"}
          </Button>

          {onShareJob ? (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-md"
              onClick={() => onShareJob(job)}
              aria-label="Partager dans les messages"
            >
              <MessagesSquare />
            </Button>
          ) : null}

          <Button type="button" className="h-10 w-full" asChild>
            <a href={jobUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink data-icon="inline-start" />
              WEB
            </a>
          </Button>

          {pdfUrl ? (
            <Button
              variant="outline"
              type="button"
              className="h-10 w-full"
              asChild
            >
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <FileText data-icon="inline-start" />
                PDF
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              className="h-10 w-full"
              onClick={() => onOpenDetails?.(job)}
              variant="outline"
            >
              Détails
            </Button>
          )}

          <Button
            type="button"
            className="col-span-2 h-10 w-full"
            onClick={() => onOpenDetails?.(job)}
            variant="outline"
          >
            Détails
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-end gap-1 sm:gap-2"
      onClick={(event) => event.stopPropagation()}
    >
      <ActionTooltip label={isApplied ? "Déjà dans le suivi" : "Ajouter au suivi"}>
        <Button
          variant={isApplied ? "success" : "outline"}
          size="icon-sm"
          className="rounded-md"
          onClick={handleTrackApplication}
          aria-label={isApplied ? "Déjà dans le suivi" : "Ajouter au suivi"}
          disabled={!isApplicationsLoaded}
        >
          <Send className={isApplied ? "fill-current" : undefined} />
        </Button>
      </ActionTooltip>

      {onShareJob ? (
        <ActionTooltip label="Partager dans les messages">
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-md"
            onClick={() => onShareJob(job)}
            aria-label="Partager dans les messages"
          >
            <MessagesSquare />
          </Button>
        </ActionTooltip>
      ) : null}

      {pdfUrl ? (
        <ActionTooltip label="Télécharger le PDF">
          <Button variant="outline" size="icon-sm" className="rounded-md" asChild>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Télécharger le PDF"
            >
              <FileText />
            </a>
          </Button>
        </ActionTooltip>
      ) : null}

      <ActionTooltip label="Ouvrir l'offre sur le site">
        <Button variant="default" size="icon-sm" asChild className="rounded-md">
          <a
            href={jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ouvrir l'offre sur le site"
          >
            <ExternalLink />
          </a>
        </Button>
      </ActionTooltip>
    </div>
  );
}

function ActionTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
