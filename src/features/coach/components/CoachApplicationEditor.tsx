"use client";

import { LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { JobApplication } from "@/types/application";

export interface CoachApplicationEditDraft {
  company: string;
  title: string;
  contractType: string;
  location: string;
  url: string;
  appliedAt: string;
  status: JobApplication["status"];
  notes: string;
  proofs: string;
  interviewAt: string;
  interviewDetails: string;
  followUpEnabled: boolean;
  followUpDueAt: string;
}

interface CoachApplicationEditorProps {
  draft: CoachApplicationEditDraft;
  isManual: boolean;
  isSaving: boolean;
  onDraftChange: (updater: (current: CoachApplicationEditDraft) => CoachApplicationEditDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}

export function CoachApplicationEditor({
  draft,
  isManual,
  isSaving,
  onDraftChange,
  onCancel,
  onSave,
}: CoachApplicationEditorProps) {
  return (
    <div className="space-y-4 rounded-xl border bg-background/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-foreground">Éditer la candidature</p>
      </div>

      {isManual ? (
        <FieldGroup className="grid gap-3 lg:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="coach-application-company">Entreprise</FieldLabel>
            <Input
              id="coach-application-company"
              value={draft.company}
              onChange={(event) =>
                onDraftChange((current) => ({ ...current, company: event.target.value }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="coach-application-contract-type">Type</FieldLabel>
            <Input
              id="coach-application-contract-type"
              value={draft.contractType}
              onChange={(event) =>
                onDraftChange((current) => ({ ...current, contractType: event.target.value }))
              }
            />
          </Field>
          <Field className="lg:col-span-2">
            <FieldLabel htmlFor="coach-application-title">Intitulé</FieldLabel>
            <Input
              id="coach-application-title"
              value={draft.title}
              onChange={(event) =>
                onDraftChange((current) => ({ ...current, title: event.target.value }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="coach-application-location">Lieu</FieldLabel>
            <Input
              id="coach-application-location"
              value={draft.location}
              onChange={(event) =>
                onDraftChange((current) => ({ ...current, location: event.target.value }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="coach-application-url">Lien de l&apos;offre</FieldLabel>
            <Input
              id="coach-application-url"
              value={draft.url}
              onChange={(event) => onDraftChange((current) => ({ ...current, url: event.target.value }))}
              placeholder="https://..."
            />
          </Field>
        </FieldGroup>
      ) : null}

      <FieldGroup className="grid gap-3 lg:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="coach-application-applied-at">Date d&apos;envoi</FieldLabel>
          <Input
            id="coach-application-applied-at"
            type="date"
            value={draft.appliedAt}
            onChange={(event) =>
              onDraftChange((current) => ({ ...current, appliedAt: event.target.value }))
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="coach-application-status">Statut</FieldLabel>
          <Select
            value={draft.status}
            onValueChange={(value) =>
              onDraftChange((current) => ({
                ...current,
                status: value as JobApplication["status"],
              }))
            }
          >
            <SelectTrigger id="coach-application-status" className="w-full">
              <SelectValue placeholder="Choisir un statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="follow_up">Relance à faire</SelectItem>
              <SelectItem value="interview">Entretien</SelectItem>
              <SelectItem value="accepted">Acceptée</SelectItem>
              <SelectItem value="rejected">Refusée</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <FieldGroup className="grid gap-3 lg:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="coach-application-follow-up-enabled">Relance active</FieldLabel>
          <Select
            value={draft.followUpEnabled ? "yes" : "no"}
            onValueChange={(value) =>
              onDraftChange((current) => ({
                ...current,
                followUpEnabled: value === "yes",
              }))
            }
          >
            <SelectTrigger id="coach-application-follow-up-enabled" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Oui</SelectItem>
              <SelectItem value="no">Non</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="coach-application-follow-up-date">Date de relance</FieldLabel>
          <Input
            id="coach-application-follow-up-date"
            type="date"
            value={draft.followUpDueAt}
            onChange={(event) =>
              onDraftChange((current) => ({ ...current, followUpDueAt: event.target.value }))
            }
          />
          <FieldDescription>Désactivée si la candidature est acceptée, refusée ou en entretien.</FieldDescription>
        </Field>
      </FieldGroup>

      <FieldGroup className="grid gap-3 lg:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="coach-application-interview-at">Entretien</FieldLabel>
          <Input
            id="coach-application-interview-at"
            type="datetime-local"
            value={draft.interviewAt}
            onChange={(event) =>
              onDraftChange((current) => ({ ...current, interviewAt: event.target.value }))
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="coach-application-interview-details">Détails entretien</FieldLabel>
          <Textarea
            id="coach-application-interview-details"
            className="min-h-24"
            value={draft.interviewDetails}
            onChange={(event) =>
              onDraftChange((current) => ({ ...current, interviewDetails: event.target.value }))
            }
          />
        </Field>
      </FieldGroup>

      <FieldGroup className="grid gap-3 lg:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="coach-application-notes">Notes bénéficiaire</FieldLabel>
          <Textarea
            id="coach-application-notes"
            className="min-h-28"
            value={draft.notes}
            onChange={(event) => onDraftChange((current) => ({ ...current, notes: event.target.value }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="coach-application-proofs">Pièces / références</FieldLabel>
          <Textarea
            id="coach-application-proofs"
            className="min-h-28"
            value={draft.proofs}
            onChange={(event) => onDraftChange((current) => ({ ...current, proofs: event.target.value }))}
          />
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Annuler
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={isSaving || (isManual && (!draft.company.trim() || !draft.title.trim()))}
        >
          {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer les changements
        </Button>
      </div>
    </div>
  );
}
