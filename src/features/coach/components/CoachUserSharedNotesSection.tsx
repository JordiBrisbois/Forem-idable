"use client";

import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatCoachAuthorName, summarizeCoachContributors } from "@/lib/coachNotes";
import { CoachSharedNote } from "@/types/application";
import { formatCoachDate } from "@/features/coach/utils";

interface CoachUserSharedNotesSectionProps {
  jobId: string;
  notes: CoachSharedNote[];
  savingCoachNoteKey: string | null;
  newDraft: string;
  hasNewDraft: boolean;
  getDraft: (noteId: string, fallback: string) => string;
  onDraftChange: (noteId: string, value: string) => void;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onNewDraftChange: (value: string) => void;
  onCreate: () => Promise<void>;
  onDelete: (noteId: string) => void;
  onSave: (noteId: string, content: string) => void;
}

export function CoachUserSharedNotesSection({
  jobId,
  notes,
  savingCoachNoteKey,
  newDraft,
  hasNewDraft,
  getDraft,
  onDraftChange,
  onStartCreate,
  onCancelCreate,
  onNewDraftChange,
  onCreate,
  onDelete,
  onSave,
}: CoachUserSharedNotesSectionProps) {
  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">Notes partagées</p>
          <p className="text-xs text-muted-foreground">
            Ces notes sont visibles par le bénéficiaire.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onStartCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une note partagée
        </Button>
      </div>

      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => {
            const draft = getDraft(note.id, note.content);

            return (
              <div key={note.id} className="space-y-2 rounded-lg border bg-card p-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Rédigée par {formatCoachAuthorName(note.createdBy)} •{" "}
                    {formatCoachDate(note.updatedAt, true)}
                  </p>
                  {note.contributors.length > 1 ? (
                    <p className="text-xs text-muted-foreground">
                      Contributions: {summarizeCoachContributors(note.contributors)}
                    </p>
                  ) : null}
                </div>
                <Textarea
                  className="min-h-28"
                  data-testid="coach-shared-note-editor"
                  value={draft}
                  onChange={(event) => onDraftChange(note.id, event.target.value)}
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(note.id)}
                    disabled={savingCoachNoteKey === `delete:${note.id}`}
                  >
                    {savingCoachNoteKey === `delete:${note.id}` ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Supprimer
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onSave(note.id, draft)}
                    disabled={savingCoachNoteKey === `shared:${note.id}` || draft === note.content}
                  >
                    {savingCoachNoteKey === `shared:${note.id}` ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Enregistrer
                  </Button>
                </div>
              </div>
            );
          })}
          <div className="flex justify-end">
            <Button type="button" size="sm" variant="outline" onClick={onStartCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une note partagée
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucune note partagée pour l&apos;instant.
        </p>
      )}

      {hasNewDraft ? (
        <div className="space-y-2 rounded-lg border border-dashed bg-card p-3">
          <p className="text-sm font-medium text-foreground">Nouvelle note partagée</p>
          <Textarea
            className="min-h-28"
            data-testid="coach-shared-note-create"
            value={newDraft}
            onChange={(event) => onNewDraftChange(event.target.value)}
            placeholder="Message ou consigne visible par le bénéficiaire..."
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onCancelCreate}>
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void onCreate()}
              disabled={savingCoachNoteKey === `create:${jobId}` || !newDraft.trim()}
            >
              {savingCoachNoteKey === `create:${jobId}` ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Ajouter
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
