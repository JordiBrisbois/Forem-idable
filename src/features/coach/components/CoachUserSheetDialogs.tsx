"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getCoachUserDisplayName } from "@/features/coach/utils";
import { CoachUserSummary } from "@/types/coach";

interface CoachUserSheetDialogsProps {
  user: CoachUserSummary;
  editingJobId: string | null;
  deleteApplicationTarget: { jobId: string; title: string } | null;
  deleteSharedTarget: { jobId: string; noteId: string } | null;
  savingCoachNoteKey: string | null;
  onDeleteApplicationTargetChange: (target: { jobId: string; title: string } | null) => void;
  onDeleteSharedTargetChange: (target: { jobId: string; noteId: string } | null) => void;
  onResetApplicationEditor: () => void;
  onDeleteApplication: (userId: number, jobId: string) => Promise<boolean>;
  onDeleteSharedCoachNote: (userId: number, jobId: string, noteId: string) => Promise<boolean>;
}

export function CoachUserSheetDialogs({
  user,
  editingJobId,
  deleteApplicationTarget,
  deleteSharedTarget,
  savingCoachNoteKey,
  onDeleteApplicationTargetChange,
  onDeleteSharedTargetChange,
  onResetApplicationEditor,
  onDeleteApplication,
  onDeleteSharedCoachNote,
}: CoachUserSheetDialogsProps) {
  return (
    <>
      <AlertDialog
        open={Boolean(deleteApplicationTarget)}
        onOpenChange={(open) => !open && onDeleteApplicationTargetChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la candidature</AlertDialogTitle>
            <AlertDialogDescription>
              La candidature <strong>{deleteApplicationTarget?.title}</strong> sera retirée du suivi de{" "}
              {getCoachUserDisplayName(user)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onDeleteApplicationTargetChange(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!deleteApplicationTarget) return;
                const deleted = await onDeleteApplication(user.id, deleteApplicationTarget.jobId);
                if (deleted) {
                  if (editingJobId === deleteApplicationTarget.jobId) {
                    onResetApplicationEditor();
                  }
                  onDeleteApplicationTargetChange(null);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteSharedTarget)}
        onOpenChange={(open) => !open && onDeleteSharedTargetChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la note partagée</AlertDialogTitle>
            <AlertDialogDescription>
              Cette note ne sera plus visible par le bénéficiaire. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onDeleteSharedTargetChange(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!deleteSharedTarget) return;
                const deleted = await onDeleteSharedCoachNote(
                  user.id,
                  deleteSharedTarget.jobId,
                  deleteSharedTarget.noteId
                );
                if (deleted) {
                  onDeleteSharedTargetChange(null);
                }
              }}
              disabled={
                !deleteSharedTarget ||
                savingCoachNoteKey === `delete:${deleteSharedTarget.noteId}`
              }
            >
              {deleteSharedTarget && savingCoachNoteKey === `delete:${deleteSharedTarget.noteId}` ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
