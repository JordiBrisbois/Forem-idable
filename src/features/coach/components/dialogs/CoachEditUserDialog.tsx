"use client";

import { useWatch, UseFormReturn } from "react-hook-form";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CoachEditTarget } from "@/features/coach/types";
import { ManagedUserEditorFormValues } from "@/features/coach/useManagedUserEditor";

interface CoachEditUserDialogProps {
  editTarget: CoachEditTarget | null;
  form: UseFormReturn<ManagedUserEditorFormValues>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ManagedUserEditorFormValues) => Promise<void>;
}

export function CoachEditUserDialog({
  editTarget,
  form,
  onOpenChange,
  onSubmit,
}: CoachEditUserDialogProps) {
  const [firstName = "", lastName = "", password = "", confirmPassword = ""] = useWatch({
    control: form.control,
    name: ["firstName", "lastName", "password", "confirmPassword"],
  });
  const firstNameError = form.formState.errors.firstName?.message;
  const lastNameError = form.formState.errors.lastName?.message;
  const passwordError = form.formState.errors.password?.message;
  const confirmPasswordError = form.formState.errors.confirmPassword?.message;
  const hasPasswordChange = password.trim().length > 0 || confirmPassword.trim().length > 0;
  const canSubmit =
    form.formState.isValid && firstName.trim().length > 0 && lastName.trim().length > 0;

  return (
    <Dialog open={Boolean(editTarget)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Éditer l&apos;utilisateur</DialogTitle>
          <DialogDescription>
            {editTarget
              ? `Mettre à jour le profil de ${editTarget.email}. Le mot de passe est optionnel.`
              : "Mettre à jour le profil utilisateur."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
          })}
        >
          <FieldGroup className="gap-4">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={firstNameError ? "true" : undefined}>
                <FieldLabel htmlFor="coach-edit-first-name">Prénom</FieldLabel>
                <Input
                  id="coach-edit-first-name"
                  placeholder="Prénom"
                  aria-invalid={firstNameError ? "true" : "false"}
                  {...form.register("firstName")}
                />
                {firstNameError ? <FieldError>{firstNameError}</FieldError> : null}
              </Field>

              <Field data-invalid={lastNameError ? "true" : undefined}>
                <FieldLabel htmlFor="coach-edit-last-name">Nom</FieldLabel>
                <Input
                  id="coach-edit-last-name"
                  placeholder="Nom"
                  aria-invalid={lastNameError ? "true" : "false"}
                  {...form.register("lastName")}
                />
                {lastNameError ? <FieldError>{lastNameError}</FieldError> : null}
              </Field>
            </FieldGroup>

            <FieldGroup className="rounded-lg border border-border/60 bg-muted/20 p-4">
              <Field data-invalid={passwordError ? "true" : undefined}>
                <FieldLabel htmlFor="coach-edit-password">Nouveau mot de passe</FieldLabel>
                <Input
                  id="coach-edit-password"
                  type="password"
                  placeholder="Laisser vide pour ne pas changer"
                  aria-invalid={passwordError ? "true" : "false"}
                  {...form.register("password")}
                />
                <FieldDescription>
                  Au moins 8 caractères si un changement est demandé.
                </FieldDescription>
                {passwordError ? <FieldError>{passwordError}</FieldError> : null}
              </Field>

              <Field data-invalid={confirmPasswordError ? "true" : undefined}>
                <FieldLabel htmlFor="coach-edit-password-confirm">
                  Confirmer le mot de passe
                </FieldLabel>
                <Input
                  id="coach-edit-password-confirm"
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  aria-invalid={confirmPasswordError ? "true" : "false"}
                  {...form.register("confirmPassword")}
                />
                {!confirmPasswordError && hasPasswordChange ? (
                  <FieldDescription>
                    Les deux champs doivent rester identiques.
                  </FieldDescription>
                ) : null}
                {confirmPasswordError ? <FieldError>{confirmPasswordError}</FieldError> : null}
              </Field>
            </FieldGroup>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!canSubmit || form.formState.isSubmitting}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
