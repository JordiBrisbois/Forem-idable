"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { JobApplication } from "@/types/application";

export interface InterviewFormState {
  interviewAt: string;
  interviewDetails: string;
}

interface InterviewDialogProps {
  application: JobApplication | null;
  open: boolean;
  form: InterviewFormState;
  onOpenChange: (open: boolean) => void;
  onFormChange: (next: InterviewFormState) => void;
  onRemove: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function InterviewDialog({
  application,
  open,
  form,
  onOpenChange,
  onFormChange,
  onRemove,
  onCancel,
  onSubmit,
}: InterviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Planifier un entretien</DialogTitle>
            <DialogDescription>
              {application
                ? `Planifiez la date d'entretien pour ${application.job.company || application.job.title}.`
                : "Planifiez une date d'entretien."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="application-interview-at">Date et heure</FieldLabel>
              <Input
                id="application-interview-at"
                type="datetime-local"
                value={form.interviewAt}
                onChange={(event) => onFormChange({ ...form, interviewAt: event.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="application-interview-details">Informations pratiques</FieldLabel>
              <Textarea
                id="application-interview-details"
                className="min-h-28"
                value={form.interviewDetails}
                onChange={(event) =>
                  onFormChange({ ...form, interviewDetails: event.target.value })
                }
                placeholder="Adresse, Teams, contact, documents à prévoir..."
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={onRemove}
              disabled={!application?.interviewAt}
            >
              Supprimer l&apos;entretien
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={!form.interviewAt}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
