import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ContractTypeSelect } from "@/components/jobs/ContractTypeSelect";
import { getJobExternalUrl } from "@/features/jobs/utils/jobLinks";
import { JobApplication } from "@/types/application";

interface OfferDetailsSectionProps {
  application: JobApplication;
  isManual: boolean;
  isEditingManualDetails: boolean;
  manualDetailsForm: {
    company: string;
    title: string;
    contractType: string;
    location: string;
    url: string;
  };
  onManualDetailsFormChange: React.Dispatch<
    React.SetStateAction<{
      company: string;
      title: string;
      contractType: string;
      location: string;
      url: string;
    }>
  >;
  onCancelEdit: () => void;
  onSave: () => Promise<void>;
}

export function OfferDetailsSection({
  application,
  isManual,
  isEditingManualDetails,
  manualDetailsForm,
  onManualDetailsFormChange,
  onCancelEdit,
  onSave,
}: OfferDetailsSectionProps) {
  const jobUrl =
    application.job.url && application.job.url !== "#"
      ? getJobExternalUrl(application.job)
      : null;

  if (isManual && isEditingManualDetails) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
        <FieldGroup className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="sheet-manual-company">Entreprise</FieldLabel>
            <Input
              id="sheet-manual-company"
              value={manualDetailsForm.company}
              onChange={(event) =>
                onManualDetailsFormChange((current) => ({
                  ...current,
                  company: event.target.value,
                }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sheet-manual-contract-type">Type</FieldLabel>
            <ContractTypeSelect
              id="sheet-manual-contract-type"
              value={manualDetailsForm.contractType}
              onValueChange={(value) =>
                onManualDetailsFormChange((current) => ({
                  ...current,
                  contractType: value,
                }))
              }
            />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="sheet-manual-title">Intitulé</FieldLabel>
            <Input
              id="sheet-manual-title"
              value={manualDetailsForm.title}
              onChange={(event) =>
                onManualDetailsFormChange((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sheet-manual-location">Lieu</FieldLabel>
            <Input
              id="sheet-manual-location"
              value={manualDetailsForm.location}
              onChange={(event) =>
                onManualDetailsFormChange((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sheet-manual-url">Lien de l&apos;offre</FieldLabel>
            <Input
              id="sheet-manual-url"
              value={manualDetailsForm.url}
              onChange={(event) =>
                onManualDetailsFormChange((current) => ({
                  ...current,
                  url: event.target.value,
                }))
              }
              placeholder="https://..."
            />
          </Field>
        </FieldGroup>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => void onSave()}
            disabled={!manualDetailsForm.company.trim() || !manualDetailsForm.title.trim()}
          >
            <Save data-icon="inline-start" />
            Enregistrer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-muted-foreground">
      <p>{application.job.company || "Entreprise non précisée"}</p>
      <p className="font-medium text-foreground">{application.job.title}</p>
      <p>{application.job.location || "Non précisé"}</p>
      <p>Type: {application.job.contractType || "Non précisé"}</p>
      <p className="break-all">Lien: {jobUrl || "Aucun"}</p>
    </div>
  );
}
