import { Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  formatApplicationDate,
  shouldShowFollowUpDetails,
} from "@/features/applications/utils";
import { JobApplication } from "@/types/application";

interface FollowUpSectionProps {
  application: JobApplication;
  followUpForm: {
    enabled: boolean;
    dueAt: string;
  };
  followUpSaveState: "idle" | "error";
  defaultFollowUpDate: string;
  onFollowUpFormChange: (nextForm: { enabled: boolean; dueAt: string }) => void;
  onSave: (nextForm: { enabled: boolean; dueAt: string }) => Promise<void>;
}

export function FollowUpSection({
  application,
  followUpForm,
  followUpSaveState,
  defaultFollowUpDate,
  onFollowUpFormChange,
  onSave,
}: FollowUpSectionProps) {
  if (!shouldShowFollowUpDetails(application.status)) {
    return (
      <p className="text-muted-foreground">
        Aucune relance automatique sur une candidature clôturée.
      </p>
    );
  }

  return (
    <FieldGroup className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <Field>
        <FieldLabel htmlFor="sheet-follow-up-date">
          {followUpForm.enabled ? "Relance active" : "Relance désactivée"}
        </FieldLabel>
        <Input
          id="sheet-follow-up-date"
          type="date"
          value={followUpForm.dueAt}
          onChange={(event) =>
            onFollowUpFormChange({
              ...followUpForm,
              dueAt: event.target.value,
            })
          }
        />
        <FieldDescription>
          {followUpForm.enabled
            ? `Prochaine relance: ${formatApplicationDate(followUpForm.dueAt)}`
            : "Relance désactivée pour cette candidature."}
        </FieldDescription>
      </Field>
      <div className="flex flex-col gap-1 text-muted-foreground">
        {application.lastFollowUpAt ? (
          <p>Dernière relance: {formatApplicationDate(application.lastFollowUpAt)}</p>
        ) : null}
        {followUpSaveState === "error" ? (
          <Alert variant="destructive">
            <AlertTitle>Relance</AlertTitle>
            <AlertDescription>Impossible d&apos;enregistrer la relance.</AlertDescription>
          </Alert>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            onFollowUpFormChange({
              ...followUpForm,
              dueAt: defaultFollowUpDate,
            })
          }
          disabled={followUpForm.dueAt === defaultFollowUpDate}
        >
          Remettre à J+7
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            void onSave({
              enabled: !followUpForm.enabled,
              dueAt: followUpForm.dueAt || defaultFollowUpDate,
            })
          }
        >
          {followUpForm.enabled ? "Désactiver la relance" : "Activer la relance"}
        </Button>
        <Button
          type="button"
          onClick={() =>
            void onSave({
              enabled: true,
              dueAt: followUpForm.dueAt || defaultFollowUpDate,
            })
          }
          disabled={!followUpForm.dueAt}
        >
          <Save data-icon="inline-start" />
          Mettre à jour la relance
        </Button>
      </div>
    </FieldGroup>
  );
}
