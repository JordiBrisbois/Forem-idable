"use client";

import { CheckSquare, Send, X } from "lucide-react";
import { Job } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractTypeBadge } from "@/components/jobs/ContractTypeBadge";
import { getJobExternalUrl } from "@/features/jobs/utils/jobLinks";

interface SelectionPanelProps {
  selectedJobs: Job[];
  onReset: () => void;
  onRemove: (job: Job) => void;
  onSendToApplications: () => void;
  sendDisabled?: boolean;
}

export function SelectionPanel({
  selectedJobs,
  onReset,
  onRemove,
  onSendToApplications,
  sendDisabled = false,
}: SelectionPanelProps) {
  if (selectedJobs.length === 0) return null;

  return (
    <Card className="border-border/60 bg-linear-to-br from-card to-muted/15">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckSquare data-icon="inline-start" />
            Sélection ({selectedJobs.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Gardez un lot court d&apos;offres à comparer avant envoi dans le suivi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" className="shadow-sm" onClick={onSendToApplications} disabled={sendDisabled}>
            <Send data-icon="inline-start" />
            Envoyer vers Candidatures
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset}>
            Réinitialiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {selectedJobs.map((job) => {
          const jobUrl = getJobExternalUrl(job);

          return (
            <div
              key={job.id}
              className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/80 p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm leading-snug">{job.title}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onRemove(job)}
                  className="rounded-full"
                  aria-label="Retirer de la sélection"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">{job.source}</Badge>
                <ContractTypeBadge contractType={job.contractType} />
              </div>
              <p className="text-xs text-muted-foreground">{job.location}</p>
              <p className="text-xs text-muted-foreground">
                {job.company || "Entreprise non précisée"}
              </p>
              <Button asChild size="sm" variant="outline" className="mt-auto rounded-full">
                <a href={jobUrl} target="_blank" rel="noopener noreferrer">
                  Voir l&apos;offre
                </a>
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
