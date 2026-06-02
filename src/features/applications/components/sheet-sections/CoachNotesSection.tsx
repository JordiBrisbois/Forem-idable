import { JobApplication } from "@/types/application";
import { formatCoachAuthorName, summarizeCoachContributors } from "@/lib/coachNotes";
import { formatApplicationDateTime } from "@/features/applications/utils";

interface CoachNotesSectionProps {
  application: JobApplication;
}

export function CoachNotesSection({ application }: CoachNotesSectionProps) {
  return (
    <>
      {application.sharedCoachNotes?.map((note) => (
        <div
          key={note.id}
          className="rounded-md border border-border/60 bg-muted/20 px-3 py-3 text-sm text-muted-foreground"
        >
          <div className="flex flex-col gap-1 text-xs">
            <p>
              Rédigée par {formatCoachAuthorName(note.createdBy)} •{" "}
              {formatApplicationDateTime(note.updatedAt)}
            </p>
            {note.contributors.length > 1 ? (
              <p>Contributions: {summarizeCoachContributors(note.contributors)}</p>
            ) : null}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm">{note.content}</p>
        </div>
      ))}
    </>
  );
}
