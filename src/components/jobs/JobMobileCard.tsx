"use client";

import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Job } from "@/types/job";
import { ContractTypeBadge } from "./ContractTypeBadge";
import { JobActions } from "./JobActions";
import { formatPublicationDateCompact } from "./jobTableUtils";

interface JobMobileCardProps {
  job: Job;
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

export function JobMobileCard({
  job,
  isSelected,
  isAuthenticated,
  isApplicationsLoaded,
  isApplied,
  onToggleSelection,
  onTrackApplication,
  onRequireAuth,
  onOpenDetails,
  onShareJob,
}: JobMobileCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-background p-4 transition-colors",
        onOpenDetails ? "cursor-pointer hover:bg-muted/20" : undefined
      )}
      onClick={onOpenDetails ? () => onOpenDetails(job) : undefined}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ContractTypeBadge contractType={job.contractType} />
          <span className="text-xs text-muted-foreground">
            {formatPublicationDateCompact(job.publicationDate)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold leading-snug text-foreground">
            {job.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {job.company || "Entreprise non précisée"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          <span>{job.location || "Lieu non précisé"}</span>
        </div>
        <JobActions
          job={job}
          layout="mobile"
          isSelected={isSelected}
          isAuthenticated={isAuthenticated}
          isApplicationsLoaded={isApplicationsLoaded}
          isApplied={isApplied}
          onToggleSelection={onToggleSelection}
          onTrackApplication={onTrackApplication}
          onRequireAuth={onRequireAuth}
          onOpenDetails={onOpenDetails}
          onShareJob={onShareJob}
        />
      </div>
    </div>
  );
}
