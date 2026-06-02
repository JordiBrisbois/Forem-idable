import { z } from "zod";

export const adminLegalHoldFormSchema = z.object({
  targetType: z.enum(["user", "conversation", "application"]),
  targetId: z
    .string()
    .trim()
    .min(1, "Cible invalide.")
    .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, "Cible invalide."),
  reason: z.string().trim().min(1, "Motif requis.").max(2000, "Motif trop long."),
});

export type AdminLegalHoldFormValues = z.infer<typeof adminLegalHoldFormSchema>;

export const adminDisclosureLogFormSchema = z.object({
  requestType: z.enum(["authority_request", "litigation", "other"]),
  authorityName: z.string().trim().min(1, "Autorité requise.").max(255, "Autorité trop longue."),
  legalBasis: z.string().trim().max(500, "Base légale trop longue.").optional().or(z.literal("")),
  targetType: z.enum(["user", "conversation", "application", "export", "other"]),
  targetId: z.string().trim().optional(),
  scopeSummary: z.string().trim().min(1, "Périmètre requis.").max(4000, "Périmètre trop long."),
  exportReference: z.string().trim().max(255, "Référence trop longue.").optional().or(z.literal("")),
});

export type AdminDisclosureLogFormValues = z.infer<typeof adminDisclosureLogFormSchema>;
