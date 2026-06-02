import { JobApplication } from "@/types/application";
import { formatApplicationDateTime } from "@/features/applications/utils";

interface InterviewDetailsSectionProps {
  application: JobApplication;
}

export function InterviewDetailsSection({ application }: InterviewDetailsSectionProps) {
  return (
    <>
      <p className="text-muted-foreground">
        {application.interviewAt
          ? formatApplicationDateTime(application.interviewAt ?? undefined)
          : "Aucun entretien planifié"}
      </p>
      {application.interviewDetails ? (
        <p className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-muted-foreground">
          {application.interviewDetails}
        </p>
      ) : null}
    </>
  );
}
