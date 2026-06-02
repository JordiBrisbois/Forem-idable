"use client";

import { addDays, format } from "date-fns";
import { useState } from "react";
import { CalendarDays, FilePenLine, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ApplicationsOfferButtons } from "@/features/applications/components/ApplicationsOfferButtons";
import { useApplicationDerivedState } from "@/features/applications/hooks/useApplicationDerivedState";
import { ApplicationStatusSelect } from "@/features/applications/components/ApplicationStatusSelect";
import {
  applicationStatusLabel,
  formatApplicationDate,
  isManualApplication,
} from "@/features/applications/utils";
import { getApplicationStatusBadgeVariant } from "@/lib/cardColors";
import { ApplicationStatus, JobApplication } from "@/types/application";
import {
  CoachNotesSection,
  DetailsSection,
  EditableTextSection,
  FollowUpSection,
  InterviewDetailsSection,
  OfferDetailsSection,
} from "@/features/applications/components/sheet-sections";

interface ApplicationDetailsSheetProps {
  application: JobApplication | null;
  open: boolean;
  hasUnreadCoachUpdate: boolean;
  notesDraft: string;
  proofsDraft: string;
  onOpenChange: (open: boolean) => void;
  onApplyStatus: (jobId: string, status: ApplicationStatus) => void;
  onNotesDraftChange: (value: string) => void;
  onProofsDraftChange: (value: string) => void;
  onSaveNotes: () => Promise<void>;
  onSaveProofs: () => Promise<void>;
  onSaveManualDetails: (input: {
    company: string;
    title: string;
    contractType: string;
    location: string;
    url: string;
  }) => Promise<boolean>;
  onSaveFollowUpSettings: (input: { enabled: boolean; dueAt: string }) => Promise<boolean>;
  onMarkFollowUpDone: (jobId: string) => void;
  onOpenInterview: (application: JobApplication) => void;
  onRequestDelete: (jobId: string) => void;
}

export function ApplicationDetailsSheet({
  application,
  open,
  hasUnreadCoachUpdate,
  notesDraft,
  proofsDraft,
  onOpenChange,
  onApplyStatus,
  onNotesDraftChange,
  onProofsDraftChange,
  onSaveNotes,
  onSaveProofs,
  onSaveManualDetails,
  onSaveFollowUpSettings,
  onMarkFollowUpDone,
  onOpenInterview,
  onRequestDelete,
}: ApplicationDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[60vw]">
        {application ? (
          <ApplicationDetailsSheetBody
            key={application.job.id}
            application={application}
            hasUnreadCoachUpdate={hasUnreadCoachUpdate}
            notesDraft={notesDraft}
            proofsDraft={proofsDraft}
            onApplyStatus={onApplyStatus}
            onNotesDraftChange={onNotesDraftChange}
            onProofsDraftChange={onProofsDraftChange}
            onSaveNotes={onSaveNotes}
            onSaveProofs={onSaveProofs}
            onSaveManualDetails={onSaveManualDetails}
            onSaveFollowUpSettings={onSaveFollowUpSettings}
            onMarkFollowUpDone={onMarkFollowUpDone}
            onOpenInterview={onOpenInterview}
            onRequestDelete={onRequestDelete}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

interface ApplicationDetailsSheetBodyProps
  extends Omit<ApplicationDetailsSheetProps, "application" | "open" | "onOpenChange"> {
  application: JobApplication;
}

function ApplicationDetailsSheetBody({
  application,
  hasUnreadCoachUpdate,
  notesDraft,
  proofsDraft,
  onApplyStatus,
  onNotesDraftChange,
  onProofsDraftChange,
  onSaveNotes,
  onSaveProofs,
  onSaveManualDetails,
  onSaveFollowUpSettings,
  onMarkFollowUpDone,
  onOpenInterview,
  onRequestDelete,
}: ApplicationDetailsSheetBodyProps) {
  const isManual = isManualApplication(application);
  const now = new Date();
  const { followUpEnabled, displayStatus, hasInterview, isDue } =
    useApplicationDerivedState(application, now);
  const defaultFollowUpDate = formatDefaultFollowUpDate(application.appliedAt);
  const initialFollowUpForm = {
    enabled: followUpEnabled,
    dueAt: getEditableFollowUpDate(application.followUpDueAt, defaultFollowUpDate),
  };
  const [isEditingManualDetails, setIsEditingManualDetails] = useState(false);
  const [followUpForm, setFollowUpForm] = useState(initialFollowUpForm);
  const [followUpSaveState, setFollowUpSaveState] = useState<"idle" | "error">("idle");
  const [manualDetailsForm, setManualDetailsForm] = useState(createManualDetailsForm(application));
  const resetManualDetailsForm = () => {
    setManualDetailsForm(createManualDetailsForm(application));
  };

  const saveFollowUpForm = async (nextForm: typeof initialFollowUpForm) => {
    const normalizedForm = {
      enabled: nextForm.enabled,
      dueAt: nextForm.dueAt || defaultFollowUpDate,
    };

    const saved = await onSaveFollowUpSettings(normalizedForm);
    if (saved) {
      setFollowUpForm(normalizedForm);
      setFollowUpSaveState("idle");
      return;
    }

    setFollowUpSaveState("error");
  };

  return (
    <>
      <SheetHeader className="border-b bg-muted/30 p-5 pr-12">
        <SheetTitle>{application.job.title}</SheetTitle>
        <SheetDescription>
          {application.job.company || "Entreprise non précisée"} • {application.job.location}
        </SheetDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="outline">{application.job.contractType || "Non précisé"}</Badge>
          {isManual ? (
            <Badge variant="secondary">Manuelle</Badge>
          ) : (
            <Badge variant="secondary">Importée</Badge>
          )}
          {application.sharedCoachNotes && application.sharedCoachNotes.length > 0 ? (
            <Badge variant="secondary">
              {hasUnreadCoachUpdate ? "Nouveau" : "Retour coach"}
            </Badge>
          ) : null}
          <Badge variant="outline">Envoyée le {formatApplicationDate(application.appliedAt)}</Badge>
          <Badge variant={getApplicationStatusBadgeVariant(displayStatus, isDue, hasInterview)}>
            {applicationStatusLabel(displayStatus)}
          </Badge>
          {isManual ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (isEditingManualDetails) {
                  setIsEditingManualDetails(false);
                  resetManualDetailsForm();
                  return;
                }
                setIsEditingManualDetails(true);
              }}
            >
              <FilePenLine data-icon="inline-start" />
              {isEditingManualDetails ? "Annuler" : "Éditer"}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => onRequestDelete(application.job.id)}
          >
            <Trash2 data-icon="inline-start" />
            Supprimer
          </Button>
        </div>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5 text-sm">
        <DetailsSection title="Informations de l&apos;offre">
          <OfferDetailsSection
            application={application}
            isManual={isManual}
            isEditingManualDetails={isEditingManualDetails}
            manualDetailsForm={manualDetailsForm}
            onManualDetailsFormChange={setManualDetailsForm}
            onCancelEdit={() => {
              setIsEditingManualDetails(false);
              resetManualDetailsForm();
            }}
            onSave={async () => {
              const saved = await onSaveManualDetails(manualDetailsForm);
              if (saved) {
                setIsEditingManualDetails(false);
              }
            }}
          />
        </DetailsSection>

        <Separator />

        <DetailsSection title="Statut">
          <ApplicationStatusSelect
            value={displayStatus}
            onValueChange={(value) => onApplyStatus(application.job.id, value)}
          />
        </DetailsSection>

        <Separator />

        <DetailsSection title="Relance">
          <FollowUpSection
            application={application}
            followUpForm={followUpForm}
            followUpSaveState={followUpSaveState}
            defaultFollowUpDate={defaultFollowUpDate}
            onFollowUpFormChange={(nextForm) => {
              setFollowUpForm(nextForm);
              setFollowUpSaveState("idle");
            }}
            onSave={saveFollowUpForm}
          />
        </DetailsSection>

        <Separator />

        <DetailsSection title="Entretien">
          <InterviewDetailsSection application={application} />
        </DetailsSection>

        <Separator />

        <DetailsSection title="Notes">
          <EditableTextSection
            value={notesDraft}
            initialValue={application.notes ?? ""}
            minHeightClassName="min-h-40"
            placeholder="Contexte, contact RH, retour, salaire..."
            onChange={onNotesDraftChange}
            onSave={onSaveNotes}
          />
        </DetailsSection>

        <Separator />

        <DetailsSection title="Preuves / références">
          <EditableTextSection
            value={proofsDraft}
            initialValue={application.proofs ?? ""}
            minHeightClassName="min-h-32"
            onChange={onProofsDraftChange}
            onSave={onSaveProofs}
          />
        </DetailsSection>

        {application.sharedCoachNotes && application.sharedCoachNotes.length > 0 ? (
          <>
            <Separator />
            <DetailsSection title="Notes du coach">
              <CoachNotesSection application={application} />
            </DetailsSection>
          </>
        ) : null}
      </div>

      <SheetFooter className="border-t bg-background/95 p-4">
        <div className="flex w-full flex-col gap-2">
          <ApplicationsOfferButtons application={application} layout="sheet" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => onMarkFollowUpDone(application.job.id)}
              disabled={application.status === "accepted"}
            >
              Relancer
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => onOpenInterview(application)}
              disabled={application.status === "accepted" || application.status === "rejected"}
            >
              <CalendarDays data-icon="inline-start" />
              Entretien
            </Button>
          </div>
        </div>
      </SheetFooter>
    </>
  );
}

function formatDefaultFollowUpDate(appliedAt: string) {
  const baseDate = new Date(appliedAt);
  const normalizedDate = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
  return format(addDays(normalizedDate, 7), "yyyy-MM-dd");
}

function getEditableFollowUpDate(followUpDueAt: string | undefined, fallbackDate: string) {
  if (!followUpDueAt) {
    return fallbackDate;
  }
  const followUpDate = new Date(followUpDueAt);
  if (Number.isNaN(followUpDate.getTime())) {
    return fallbackDate;
  }
  return format(followUpDate, "yyyy-MM-dd");
}

function createManualDetailsForm(application: JobApplication) {
  return {
    company: application.job.company || "",
    title: application.job.title,
    contractType: application.job.contractType || "",
    location: application.job.location || "",
    url: isManualApplication(application) ? "" : application.job.url,
  };
}
