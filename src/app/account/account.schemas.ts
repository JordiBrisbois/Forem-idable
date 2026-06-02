import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis."),
  lastName: z.string().trim().min(1, "Le nom est requis."),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis."),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string().min(8, "La confirmation doit contenir au moins 8 caractères."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  });

export const apiKeySchema = z.object({
  name: z.string().trim().min(1, "Le nom de la clé est requis."),
  expiry: z.enum(["none", "30", "90", "365"]),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type PasswordFormValues = z.infer<typeof passwordSchema>;
export type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

export type FeedbackState = {
  type: "success" | "error";
  message: string;
};

export type DataExportRequestSummary = {
  id: number;
  status: "pending" | "completed" | "failed";
  format: string;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  error: string | null;
};

export type AccountDeletionRequestSummary = {
  id: number;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  reason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  reviewNote: string | null;
};

export const API_KEY_EXPIRY_OPTIONS: Array<{ value: ApiKeyFormValues["expiry"]; label: string }> =
  [
    { value: "none", label: "Sans expiration" },
    { value: "30", label: "Expire dans 30 jours" },
    { value: "90", label: "Expire dans 90 jours" },
    { value: "365", label: "Expire dans 365 jours" },
  ];

export const API_KEY_ENDPOINTS = [
  "/api/external/me",
  "/api/external/users?search=&groupId=&role=&format=json|csv",
  "/api/external/users/:id?format=json|csv",
  "/api/external/groups?search=&format=json|csv",
  "/api/external/groups/:id?format=json|csv",
  "/api/external/applications?search=&status=&groupId=&userId=&dueOnly=1&format=json|csv",
];
