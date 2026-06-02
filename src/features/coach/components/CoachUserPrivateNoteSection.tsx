"use client";

import { LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatCoachAuthorName, summarizeCoachContributors } from "@/lib/coachNotes";
import { CoachPrivateNote } from "@/types/application";
import { formatCoachDate } from "@/features/coach/utils";

interface CoachUserPrivateNoteSectionProps {
  note?: CoachPrivateNote;
  draft: string;
  isSaving: boolean;
  onDraftChange: (value: string) => void;
  onSave: () => void;
}

export function CoachUserPrivateNoteSection({
  note,
  draft,
  isSaving,
  onDraftChange,
  onSave,
}: CoachUserPrivateNoteSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-foreground">Note privée coach</p>
          {note ? (
            <span className="text-xs text-muted-foreground">
              {formatCoachDate(note.updatedAt, true)}
            </span>
          ) : null}
        </div>
        {note ? (
          <p className="text-xs text-muted-foreground">
            Rédigée par {formatCoachAuthorName(note.createdBy)}
            {note.contributors.length > 1
              ? ` • Contributions: ${summarizeCoachContributors(note.contributors)}`
              : ""}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Visible uniquement par les coachs et admins.
          </p>
        )}
      </div>
      <Textarea
        className="min-h-32"
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder="Note privée commune pour l'équipe coach..."
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={isSaving || draft === (note?.content ?? "")}
        >
          {isSaving ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </div>
    </>
  );
}
