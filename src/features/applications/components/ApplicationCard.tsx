"use client";

import { CalendarDays, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationsOfferButtons } from "@/features/applications/components/ApplicationsOfferButtons";
import { ApplicationStatusSelect } from "@/features/applications/components/ApplicationStatusSelect";
import { useApplicationDerivedState } from "@/features/applications/hooks/useApplicationDerivedState";
import {
  applicationStatusLabel,
  formatApplicationDate,
  formatApplicationDateTime,
  isManualApplication,
  shouldShowFollowUpDetails,
} from "@/features/applications/utils";
import {
  getApplicationStatusBadgeVariant,
  getStatusCardClasses,
} from "@/lib/cardColors";
import { cn } from "@/lib/utils";
import { ApplicationStatus, JobApplication } from "@/types/application";

interface ApplicationCardProps {
  application: JobApplication;
  now: Date;
  isSelected: boolean;
  hasUnreadCoachUpdate: boolean;
  onToggleSelection: (jobId: string) => void;
  onOpenDetails: (jobId: string) => void;
  onApplyStatus: (jobId: string, status: ApplicationStatus) => void;
  onMarkFollowUpDone: (jobId: string) => void;
  onOpenInterview: (application: JobApplication) => void;
}

export function ApplicationCard({
  application,
  now,
  isSelected,
  hasUnreadCoachUpdate,
  onToggleSelection,
  onOpenDetails,
  onApplyStatus,
  onMarkFollowUpDone,
  onOpenInterview,
}: ApplicationCardProps) {
  const {
    hasInterview,
    followUpEnabled,
    isDue,
    isSoon,
    displayStatus,
  } = useApplicationDerivedState(application, now);

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Ouvrir les détails de ${application.job.title} chez ${application.job.company || "Entreprise non précisée"}`}
      className={cn(
        "cursor-pointer rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20",
        getStatusCardClasses(application.status, isDue, hasInterview, hasUnreadCoachUpdate)
      )}
      onClick={() => onOpenDetails(application.job.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenDetails(application.job.id);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <label className="mt-1 shrink-0 cursor-pointer">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={isSelected}
            onChange={() => onToggleSelection(application.job.id)}
            onClick={(event) => event.stopPropagation()}
            aria-label="Sélectionner la candidature"
          />
        </label>

        <CardContent className="min-w-0 flex-1 p-0">
          <div className="flex min-h-full flex-col gap-2.5">
            <ApplicationCardHeader application={application} />
            <ApplicationCardBadges
              application={application}
              displayStatus={displayStatus}
              hasInterview={hasInterview}
              hasUnreadCoachUpdate={hasUnreadCoachUpdate}
              isDue={isDue}
            />
            <div className="mt-auto flex flex-col gap-2">
              <ApplicationStatusSelect
                value={displayStatus}
                onValueChange={(value) => onApplyStatus(application.job.id, value)}
                onTriggerClick={(event) => event.stopPropagation()}
              />

              <ApplicationsOfferButtons application={application} />

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenDetails(application.job.id);
                }}
              >
                Détails
              </Button>

              <ApplicationCardMeta
                application={application}
                followUpEnabled={followUpEnabled}
                hasInterview={hasInterview}
                isSoon={isSoon}
              />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMarkFollowUpDone(application.job.id);
                  }}
                  disabled={application.status === "accepted"}
                >
                  <Clock3 data-icon="inline-start" />
                  Relancer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenInterview(application);
                  }}
                  disabled={application.status === "accepted" || application.status === "rejected"}
                >
                  <CalendarDays data-icon="inline-start" />
                  Entretien
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function ApplicationCardHeader({ application }: { application: JobApplication }) {
  return (
    <div className="min-h-14 min-w-0 text-left">
      <p className="truncate font-semibold leading-snug hover:text-primary">
        {application.job.company || "Entreprise non précisée"}
      </p>
      <p className="line-clamp-2 text-sm text-muted-foreground">{application.job.title}</p>
      <p className="text-xs text-muted-foreground">{application.job.location}</p>
    </div>
  );
}

function ApplicationCardBadges({
  application,
  displayStatus,
  hasInterview,
  hasUnreadCoachUpdate,
  isDue,
}: {
  application: JobApplication;
  displayStatus: ApplicationStatus;
  hasInterview: boolean;
  hasUnreadCoachUpdate: boolean;
  isDue: boolean;
}) {
  return (
    <div className="flex min-h-12 flex-wrap content-start items-center gap-2">
      <Badge variant="outline">{application.job.contractType || "Non précisé"}</Badge>
      <Badge variant="secondary">
        {isManualApplication(application) ? "Manuelle" : "Importée"}
      </Badge>
      {application.sharedCoachNotes && application.sharedCoachNotes.length > 0 ? (
        <Badge variant={hasUnreadCoachUpdate ? "default" : "secondary"}>
          {hasUnreadCoachUpdate ? "Nouveau" : "Retour coach"}
        </Badge>
      ) : null}
      <Badge variant={getApplicationStatusBadgeVariant(displayStatus, isDue, hasInterview)}>
        {applicationStatusLabel(displayStatus)}
      </Badge>
      <Badge variant="outline">Envoyée le {formatApplicationDate(application.appliedAt)}</Badge>
      {hasInterview ? (
        <Badge variant="info">
          Entretien {formatApplicationDateTime(application.interviewAt ?? undefined)}
        </Badge>
      ) : null}
    </div>
  );
}

function ApplicationCardMeta({
  application,
  followUpEnabled,
  hasInterview,
  isSoon,
}: {
  application: JobApplication;
  followUpEnabled: boolean;
  hasInterview: boolean;
  isSoon: boolean;
}) {
  return (
    <div className="min-h-14 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      {shouldShowFollowUpDetails(application.status) ? (
        <>
          {followUpEnabled ? (
            <>
              <p>Relance: {formatApplicationDate(application.followUpDueAt)}</p>
              {isSoon ? <p>Bientôt</p> : null}
              {application.lastFollowUpAt ? (
                <p>Dernière: {formatApplicationDate(application.lastFollowUpAt)}</p>
              ) : null}
            </>
          ) : (
            <p>Relance désactivée.</p>
          )}
        </>
      ) : (
        <p>Aucune relance automatique sur une candidature clôturée.</p>
      )}
      {hasInterview ? (
        <p>Entretien: {formatApplicationDateTime(application.interviewAt ?? undefined)}</p>
      ) : null}
    </div>
  );
}
