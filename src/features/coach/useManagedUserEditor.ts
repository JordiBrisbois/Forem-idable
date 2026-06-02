"use client";

import { useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CoachEditTarget } from "@/features/coach/types";

const managedUserEditorSchema = z
  .object({
    firstName: z.string().trim().min(1, "Prénom requis."),
    lastName: z.string().trim().min(1, "Nom requis."),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((value, ctx) => {
    const password = value.password.trim();
    const confirmPassword = value.confirmPassword.trim();
    const hasPasswordChange = password.length > 0 || confirmPassword.length > 0;

    if (!hasPasswordChange) {
      return;
    }

    if (password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      });
    }

    if (confirmPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "La confirmation doit contenir au moins 8 caractères.",
      });
    }

    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Les deux mots de passe doivent être identiques.",
      });
    }
  });

export type ManagedUserEditorFormValues = z.infer<typeof managedUserEditorSchema>;

const MANAGED_USER_EDITOR_DEFAULT_VALUES: ManagedUserEditorFormValues = {
  firstName: "",
  lastName: "",
  password: "",
  confirmPassword: "",
};

type ManagedUserEditorSubmitValues = {
  firstName: string;
  lastName: string;
  password?: string;
};

export function useManagedUserEditor({
  onSubmit,
}: {
  onSubmit: (
    target: CoachEditTarget,
    values: ManagedUserEditorSubmitValues
  ) => Promise<boolean>;
}) {
  const [editTarget, setEditTarget] = useState<CoachEditTarget | null>(null);
  const managedUserForm = useForm<ManagedUserEditorFormValues>({
    resolver: zodResolver(managedUserEditorSchema),
    mode: "onChange",
    defaultValues: MANAGED_USER_EDITOR_DEFAULT_VALUES,
  });

  const resetManagedUserEditor = useCallback(() => {
    setEditTarget(null);
    managedUserForm.reset(MANAGED_USER_EDITOR_DEFAULT_VALUES);
  }, [managedUserForm]);

  const openManagedUserEditor = useCallback(
    (target: CoachEditTarget) => {
      setEditTarget(target);
      managedUserForm.reset({
        firstName: target.firstName,
        lastName: target.lastName,
        password: "",
        confirmPassword: "",
      });
    },
    [managedUserForm]
  );

  const handleManagedUserDialogChange = useCallback(
    (open: boolean) => {
      if (open) return;
      resetManagedUserEditor();
    },
    [resetManagedUserEditor]
  );

  const submitManagedUserEdit = useCallback(
    async (values: ManagedUserEditorFormValues) => {
      if (!editTarget) {
        return;
      }

      const success = await onSubmit(editTarget, {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        password: values.password.trim() || undefined,
      });

      if (success) {
        resetManagedUserEditor();
      }
    },
    [editTarget, onSubmit, resetManagedUserEditor]
  );

  return {
    editTarget,
    managedUserForm,
    openManagedUserEditor,
    handleManagedUserDialogChange,
    submitManagedUserEdit,
    resetManagedUserEditor,
  };
}
