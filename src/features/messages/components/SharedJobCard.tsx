"use client";

import { BriefcaseBusiness, ExternalLink, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getJobExternalUrl, getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import { getApplicationStatusBadgeVariant } from "@/lib/cardColors";
import { Job } from "@/types/job";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SharedJobCardProps {
  job: Job;
  isTracked: boolean;
  onTrack: (job: Job) => void;
}

export function SharedJobCard({ job, isTracked, onTrack }: SharedJobCardProps) {
  const pdfUrl = getJobPdfUrl(job);
  const jobUrl = getJobExternalUrl(job);
  const contractVariant = getApplicationStatusBadgeVariant(job.contractType ?? "", false, false);

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/40 bg-muted/30 px-4 py-2.5">
        <BriefcaseBusiness className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Offre Forem
        </span>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex flex-col gap-1">
          <p className="text-[0.95rem] font-semibold leading-snug break-words">{job.title}</p>
          <p className="text-sm text-muted-foreground break-words">
            {job.company || "Entreprise non précisée"} • {job.location || "Lieu non précisé"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={contractVariant as never}>{job.contractType || "Non précisé"}</Badge>
          <Badge variant="outline">
            {format(new Date(job.publicationDate), "dd MMM yyyy", { locale: fr })}
          </Badge>
          {isTracked ? (
            <Badge variant="success" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Déjà suivi
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" asChild className="h-8">
            <a href={jobUrl} target="_blank" rel="noopener noreferrer" aria-label="Ouvrir l'offre">
              <ExternalLink className="size-3.5" />
              Voir
            </a>
          </Button>

          {pdfUrl ? (
            <Button size="sm" variant="outline" asChild className="h-8">
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" aria-label="Ouvrir le PDF">
                <FileText className="size-3.5" />
                PDF
              </a>
            </Button>
          ) : null}

          {!isTracked ? (
            <Button size="sm" variant="outline" className="h-8" onClick={() => onTrack(job)}>
              <Send className="size-3.5" />
              Suivre
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
