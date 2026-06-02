"use client";

import {
  ChevronDown,
  ExternalLink,
  FilePenLine,
  FileText,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Ref } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CoachApplicationEditDraft,
  CoachApplicationEditor,
} from "@/features/coach/components/CoachApplicationEditor";
import { CoachUserPrivateNoteSection } from "@/features/coach/components/CoachUserPrivateNoteSection";
import { CoachUserSharedNotesSection } from "@/features/coach/components/CoachUserSharedNotesSection";
import { getDisplayApplicationStatus, isManualApplication } from "@/features/applications/utils";
import {
  coachStatusLabel,
  formatCoachDate,
  isApplicationDue,
} from "@/features/coach/utils";
import { getJobExternalUrl, getJobPdfUrl } from "@/features/jobs/utils/jobLinks";
import {
  getApplicationStatusBadgeVariant,
  getStatusCardClasses,
} from "@/lib/cardColors";
import { CoachUserSummary } from "@/types/coach";
import { cn } from "@/lib/utils";

interface CoachUserApplicationCardProps {
  application: CoachUserSummary["applications"][number];
  targetRef?: Ref<HTMLDivElement>;
  isOpen: boolean;
  isEditing: boolean;
  applicationDraft: CoachApplicationEditDraft | null;
  isSavingApplication: boolean;
  privateCoachNoteDraft: string;
  newSharedNoteDraft: string;
  savingCoachNoteKey: string | null;
  hasNewSharedDraft: boolean;
  getSharedDraft: (noteId: string, fallback: string) => string;
  onToggleOpen: (nextOpen: boolean) => void;
  onOpenEditor: () => void;
  onDeleteApplication: () => void;
  onApplicationDraftChange: (
    updater: (draft: CoachApplicationEditDraft) => CoachApplicationEditDraft
  ) => void;
  onCancelEdit: () => void;
  onSaveApplication: () => void;
  onPrivateDraftChange: (value: string) => void;
  onSavePrivateNote: () => void;
  onSharedDraftChange: (noteId: string, value: string) => void;
  onStartCreateSharedNote: () => void;
  onCancelCreateSharedNote: () => void;
  onNewSharedDraftChange: (value: string) => void;
  onCreateSharedNote: () => Promise<void>;
  onDeleteSharedNote: (noteId: string) => void;
  onSaveSharedNote: (noteId: string, content: string) => void;
}

export function CoachUserApplicationCard({
  application,
  targetRef,
  isOpen,
  isEditing,
  applicationDraft,
  isSavingApplication,
  privateCoachNoteDraft,
  newSharedNoteDraft,
  savingCoachNoteKey,
  hasNewSharedDraft,
  getSharedDraft,
  onToggleOpen,
  onOpenEditor,
  onDeleteApplication,
  onApplicationDraftChange,
  onCancelEdit,
  onSaveApplication,
  onPrivateDraftChange,
  onSavePrivateNote,
  onSharedDraftChange,
  onStartCreateSharedNote,
  onCancelCreateSharedNote,
  onNewSharedDraftChange,
  onCreateSharedNote,
  onDeleteSharedNote,
  onSaveSharedNote,
}: CoachUserApplicationCardProps) {
  const isDue = isApplicationDue(application);
  const isManual = isManualApplication(application);
  const jobUrl = getJobExternalUrl(application.job);
  const privateCoachNote = application.privateCoachNote;
  const displayStatus = getDisplayApplicationStatus(application);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggleOpen}>
      <div ref={targetRef} className={cn("rounded-xl border transition-colors", getStatusCardClasses(application.status, isDue, false))}>
        <div className="flex items-start gap-3 p-4">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-start justify-between gap-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-expanded={isOpen}
            >
              <div className="min-w-0 space-y-2">
                <div>
                  <p className="font-semibold">
                    {application.job.company || "Entreprise non précisée"}
                  </p>
                  <p className="text-sm text-muted-foreground">{application.job.title}</p>
                  <p className="text-xs text-muted-foreground">{application.job.location}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={getApplicationStatusBadgeVariant(application.status, isDue, false)}>
                    {coachStatusLabel(displayStatus)}
                  </Badge>
                  <Badge variant="outline">{isManual ? "Manuelle" : "Importée"}</Badge>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Envoyée: {formatCoachDate(application.appliedAt)}</p>
                  {application.status === "rejected" ||
                  application.status === "accepted" ||
                  application.status === "interview" ? (
                    <p>Aucune relance automatique</p>
                  ) : (
                    <p>Relance: {formatCoachDate(application.followUpDueAt)}</p>
                  )}
                  <p>
                    Entretien:{" "}
                    {application.interviewAt
                      ? formatCoachDate(application.interviewAt, true)
                      : "Aucun"}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-foreground/80">
                  <span>{isOpen ? "Masquer le détail" : "Cliquer pour voir le détail"}</span>
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 shrink-0 transition-transform", isOpen && "rotate-180")}
                  />
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {isOpen ? "Masquer" : "Détails"}
                </span>
                <div className="rounded-full border border-border/70 bg-background/90 p-2 text-muted-foreground shadow-sm">
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                  />
                </div>
              </div>
            </button>
          </CollapsibleTrigger>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions candidature</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={onOpenEditor}>
                <FilePenLine className="h-4 w-4" />
                Éditer la candidature
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDeleteApplication}>
                <Trash2 className="h-4 w-4" />
                Supprimer la candidature
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CollapsibleContent className="border-t px-4 pb-4 pt-4">
          <div className="space-y-4">
            {isEditing && applicationDraft ? (
              <CoachApplicationEditor
                draft={applicationDraft}
                isManual={isManual}
                isSaving={isSavingApplication}
                onDraftChange={onApplicationDraftChange}
                onCancel={onCancelEdit}
                onSave={onSaveApplication}
              />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                  <p>Statut: {coachStatusLabel(displayStatus)}</p>
                  <p>Type: {application.job.contractType || "Non précisé"}</p>
                  {application.lastFollowUpAt ? (
                    <p>Dernière relance: {formatCoachDate(application.lastFollowUpAt)}</p>
                  ) : null}
                </div>
                <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                  <p>Offre: {isManual ? "Encodée manuellement" : "Issue du site"}</p>
                  {application.interviewDetails ? (
                    <p className="mt-1 whitespace-pre-wrap">{application.interviewDetails}</p>
                  ) : null}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {application.job.url && application.job.url !== "#" ? (
                <Button type="button" size="sm" asChild>
                  <a href={jobUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    WEB
                  </a>
                </Button>
              ) : null}
              {getJobPdfUrl(application.job) ? (
                <Button type="button" size="sm" variant="outline" asChild>
                  <a
                    href={getJobPdfUrl(application.job) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    PDF
                  </a>
                </Button>
              ) : null}
            </div>

            {application.notes || application.proofs ? (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">Notes bénéficiaire</p>
                  <div className="max-h-40 overflow-y-auto pr-1">
                    <p className="whitespace-pre-wrap">{application.notes || "Aucune note"}</p>
                  </div>
                </div>
                <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">Pièces / références</p>
                  <div className="max-h-40 overflow-y-auto pr-1">
                    <p className="whitespace-pre-wrap">{application.proofs || "Aucune preuve"}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-4 rounded-lg border bg-background/80 p-3">
              <CoachUserPrivateNoteSection
                note={privateCoachNote}
                draft={privateCoachNoteDraft}
                isSaving={savingCoachNoteKey === `private:${application.job.id}`}
                onDraftChange={onPrivateDraftChange}
                onSave={onSavePrivateNote}
              />

              <CoachUserSharedNotesSection
                jobId={application.job.id}
                notes={application.sharedCoachNotes ?? []}
                savingCoachNoteKey={savingCoachNoteKey}
                newDraft={newSharedNoteDraft}
                hasNewDraft={hasNewSharedDraft}
                getDraft={getSharedDraft}
                onDraftChange={onSharedDraftChange}
                onStartCreate={onStartCreateSharedNote}
                onCancelCreate={onCancelCreateSharedNote}
                onNewDraftChange={onNewSharedDraftChange}
                onCreate={onCreateSharedNote}
                onDelete={onDeleteSharedNote}
                onSave={onSaveSharedNote}
              />
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}


