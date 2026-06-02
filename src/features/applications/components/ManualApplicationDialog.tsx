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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationStatusSelect } from "@/features/applications/components/ApplicationStatusSelect";
import { ContractTypeSelect } from "@/components/jobs/ContractTypeSelect";
import { ApplicationStatus } from "@/types/application";

export interface ManualApplicationFormState {
  company: string;
  title: string;
  contractType: string;
  location: string;
  appliedAt: string;
  status: ApplicationStatus;
  notes: string;
  proofs: string;
  url: string;
}

interface ManualApplicationDialogProps {
  open: boolean;
  form: ManualApplicationFormState;
  onOpenChange: (open: boolean) => void;
  onFormChange: (next: ManualApplicationFormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function ManualApplicationDialog({
  open,
  form,
  onOpenChange,
  onFormChange,
  onCancel,
  onSubmit,
}: ManualApplicationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Ajouter une candidature manuelle</DialogTitle>
            <DialogDescription>
              Ajoutez une candidature faite ailleurs pour l&apos;inclure dans votre suivi.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="manual-application-company">Entreprise</FieldLabel>
              <Input
                id="manual-application-company"
                value={form.company}
                onChange={(event) => onFormChange({ ...form, company: event.target.value })}
                placeholder="Nom de l'entreprise"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="manual-application-contract-type">Type</FieldLabel>
              <ContractTypeSelect
                id="manual-application-contract-type"
                value={form.contractType}
                onValueChange={(value) => onFormChange({ ...form, contractType: value })}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="manual-application-title">Intitulé</FieldLabel>
              <Input
                id="manual-application-title"
                value={form.title}
                onChange={(event) => onFormChange({ ...form, title: event.target.value })}
                placeholder="Titre du poste"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="manual-application-location">Lieu</FieldLabel>
              <Input
                id="manual-application-location"
                value={form.location}
                onChange={(event) => onFormChange({ ...form, location: event.target.value })}
                placeholder="Ville ou région"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="manual-application-applied-at">Date envoyée</FieldLabel>
              <Input
                id="manual-application-applied-at"
                type="date"
                value={form.appliedAt}
                onChange={(event) => onFormChange({ ...form, appliedAt: event.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="manual-application-status">Statut</FieldLabel>
              <ApplicationStatusSelect
                triggerId="manual-application-status"
                value={form.status}
                onValueChange={(value) => onFormChange({ ...form, status: value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="manual-application-url">Lien de l&apos;offre</FieldLabel>
              <Input
                id="manual-application-url"
                value={form.url}
                onChange={(event) => onFormChange({ ...form, url: event.target.value })}
                placeholder="https://..."
              />
            </Field>
          </FieldGroup>
          <FieldGroup className="gap-4">
            <Field>
            <FieldLabel htmlFor="manual-application-notes">Notes</FieldLabel>
            <Textarea
              id="manual-application-notes"
              className="min-h-24"
              value={form.notes}
              onChange={(event) => onFormChange({ ...form, notes: event.target.value })}
              placeholder="Contexte, contact RH, retour, salaire..."
            />
            <FieldDescription>
              Gardez ici le contexte utile pour relire rapidement la candidature.
            </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="manual-application-proofs">Pièces / références</FieldLabel>
              <Textarea
                id="manual-application-proofs"
                className="min-h-24"
                value={form.proofs}
                onChange={(event) => onFormChange({ ...form, proofs: event.target.value })}
                placeholder="Lien mail, capture, référence de refus..."
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={!form.company.trim() || !form.title.trim()}>
              Ajouter la candidature
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
