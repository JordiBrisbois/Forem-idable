"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePassword } from "@/lib/api/account";
import { FeedbackState, PasswordFormValues, passwordSchema } from "@/app/account/account.schemas";

export function usePasswordForm() {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const save = useCallback(
    async (values: PasswordFormValues) => {
      setIsSaving(true);
      setFeedback(null);

      try {
        await updatePassword({
          currentPassword: values.currentPassword,
          password: values.password,
        });

        form.reset();
        setFeedback({
          type: "success",
          message: "Mot de passe mis à jour.",
        });
      } catch {
        setFeedback({
          type: "error",
          message: "Mise à jour impossible.",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [form]
  );

  return {
    form,
    feedback,
    isSaving,
    save,
    canSubmit: form.formState.isValid && form.formState.isDirty,
  };
}
