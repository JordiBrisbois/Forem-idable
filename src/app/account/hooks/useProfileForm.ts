"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/auth/AuthProvider";
import { updateProfile } from "@/lib/api/account";
import { FeedbackState, ProfileFormValues, profileSchema } from "@/app/account/account.schemas";

export function useProfileForm() {
  const { user, refresh, setUser } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    },
  });

  const save = useCallback(
    async (values: ProfileFormValues) => {
      setIsSaving(true);
      setFeedback(null);

      try {
        const { data } = await updateProfile(values);

        if (!data.user) {
          setFeedback({
            type: "error",
            message: "Mise à jour impossible.",
          });
          return;
        }

        setUser(data.user);
        form.reset({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
        });
        await refresh();
        setFeedback({
          type: "success",
          message: "Nom et prénom mis à jour.",
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
    [form, refresh, setUser]
  );

  return {
    form,
    feedback,
    isSaving,
    save,
    canSubmit: form.formState.isValid && form.formState.isDirty,
  };
}
