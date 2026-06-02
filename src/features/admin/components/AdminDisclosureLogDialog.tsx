"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminDisclosureLogFormValues,
  adminDisclosureLogFormSchema,
} from "@/features/admin/adminComplianceSchemas";

interface AdminDisclosureLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCreating: boolean;
  onCreateDisclosureLog: (payload: {
    requestType?: "authority_request" | "litigation" | "other";
    authorityName: string;
    legalBasis?: string;
    targetType: "user" | "conversation" | "application" | "export" | "other";
    targetId?: number;
    scopeSummary: string;
    exportReference?: string;
  }) => Promise<boolean>;
}

export function AdminDisclosureLogDialog({
  open,
  onOpenChange,
  isCreating,
  onCreateDisclosureLog,
}: AdminDisclosureLogDialogProps) {
  const form = useForm<AdminDisclosureLogFormValues>({
    resolver: zodResolver(adminDisclosureLogFormSchema),
    defaultValues: {
      requestType: "authority_request",
      authorityName: "",
      legalBasis: "",
      targetType: "user",
      targetId: "",
      scopeSummary: "",
      exportReference: "",
    },
  });

  const requestType = useWatch({ control: form.control, name: "requestType" });
  const targetType = useWatch({ control: form.control, name: "targetType" });

  const onSubmit = form.handleSubmit(async (values) => {
    const parsedTargetId =
      values.targetId && values.targetId.trim().length > 0
        ? Number(values.targetId.trim())
        : undefined;

    const success = await onCreateDisclosureLog({
      requestType: values.requestType,
      authorityName: values.authorityName,
      legalBasis: values.legalBasis || undefined,
      targetType: values.targetType,
      targetId: Number.isFinite(parsedTargetId) ? parsedTargetId : undefined,
      scopeSummary: values.scopeSummary,
      exportReference: values.exportReference || undefined,
    });
    if (!success) return;

    form.reset({
      requestType: "authority_request",
      authorityName: "",
      legalBasis: "",
      targetType: "user",
      targetId: "",
      scopeSummary: "",
      exportReference: "",
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Journaliser une divulgation</DialogTitle>
          <DialogDescription>
            Conserve la trace minimale d&apos;une extraction transmise à une autorité ou dans un litige.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <FieldGroup className="gap-4">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="disclosure-request-type">Type de demande</FieldLabel>
                <Select
                  value={requestType}
                  onValueChange={(value) =>
                    form.setValue("requestType", value as AdminDisclosureLogFormValues["requestType"])
                  }
                >
                  <SelectTrigger id="disclosure-request-type">
                    <SelectValue placeholder="Type de demande" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="authority_request">Autorité</SelectItem>
                      <SelectItem value="litigation">Litige</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="disclosure-target-type">Type de cible</FieldLabel>
                <Select
                  value={targetType}
                  onValueChange={(value) =>
                    form.setValue("targetType", value as AdminDisclosureLogFormValues["targetType"])
                  }
                >
                  <SelectTrigger id="disclosure-target-type">
                    <SelectValue placeholder="Type de cible" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="conversation">Conversation</SelectItem>
                      <SelectItem value="application">Candidature</SelectItem>
                      <SelectItem value="export">Export</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <Field data-invalid={form.formState.errors.authorityName ? "true" : undefined}>
              <FieldLabel htmlFor="disclosure-authority-name">Autorité ou requérant</FieldLabel>
              <Input
                id="disclosure-authority-name"
                aria-invalid={form.formState.errors.authorityName ? "true" : "false"}
                {...form.register("authorityName")}
              />
              {form.formState.errors.authorityName ? (
                <FieldError>{form.formState.errors.authorityName.message}</FieldError>
              ) : null}
            </Field>

            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="disclosure-target-id">Identifiant cible</FieldLabel>
                <Input id="disclosure-target-id" {...form.register("targetId")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="disclosure-export-reference">Référence export</FieldLabel>
                <Input id="disclosure-export-reference" {...form.register("exportReference")} />
              </Field>
            </FieldGroup>

            <Field>
              <FieldLabel htmlFor="disclosure-legal-basis">Base légale</FieldLabel>
              <Input id="disclosure-legal-basis" {...form.register("legalBasis")} />
            </Field>

            <Field data-invalid={form.formState.errors.scopeSummary ? "true" : undefined}>
              <FieldLabel htmlFor="disclosure-scope-summary">Périmètre divulgué</FieldLabel>
              <Textarea
                id="disclosure-scope-summary"
                aria-invalid={form.formState.errors.scopeSummary ? "true" : "false"}
                {...form.register("scopeSummary")}
              />
              {form.formState.errors.scopeSummary ? (
                <FieldError>{form.formState.errors.scopeSummary.message}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating}>
              Journaliser
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
