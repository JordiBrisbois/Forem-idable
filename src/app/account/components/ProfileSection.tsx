import { UserRound } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { ProfileFormValues } from "../account.schemas";
import { AccountField } from "./AccountField";
import { AccountSectionHeader } from "./AccountSectionHeader";

type ProfileSectionProps = {
  form: UseFormReturn<ProfileFormValues>;
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
};

export function ProfileSection({
  form,
  canSubmit,
  isSubmitting,
  onSubmit,
}: ProfileSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <AccountSectionHeader
        icon={UserRound}
        title="Profil"
        description="Nom et prénom affichés dans l'application."
      />
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <FieldGroup className="gap-4">
          <AccountField
            id="account-first-name"
            label="Prénom"
            autoComplete="given-name"
            placeholder="Prénom"
            error={form.formState.errors.firstName?.message}
            {...form.register("firstName")}
          />
          <AccountField
            id="account-last-name"
            label="Nom"
            autoComplete="family-name"
            placeholder="Nom"
            error={form.formState.errors.lastName?.message}
            {...form.register("lastName")}
          />
        </FieldGroup>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="outline" disabled={!canSubmit || isSubmitting}>
            Enregistrer le profil
          </Button>
        </div>
      </form>
    </section>
  );
}
