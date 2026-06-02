import { z } from "zod";
import { normalizeContractType } from "@/lib/contractType";
import { searchHistoryEntrySchema } from "@/features/jobs/types/searchHistory";
import { Job } from "@/types/job";

export const applicationStatusSchema = z.enum([
  "in_progress",
  "follow_up",
  "interview",
  "accepted",
  "rejected",
]);

export const jobSourceSchema = z.enum(["forem", "linkedin", "indeed", "adzuna"]);
const emailSchema = z.string().trim().email("Adresse email invalide.");
const trimmedNonEmptyStringSchema = z.string().trim().min(1, "Champ requis.");

export const loginRequestSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Mot de passe requis."),
  })
  .strict()
  .transform((value) => ({
    ...value,
    email: value.email.toLowerCase(),
  }));

export const registerRequestSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    firstName: trimmedNonEmptyStringSchema,
    lastName: trimmedNonEmptyStringSchema,
  })
  .strict()
  .transform((value) => ({
    ...value,
    email: value.email.toLowerCase(),
  }));

export const forgotPasswordRequestSchema = z
  .object({
    email: emailSchema,
  })
  .strict()
  .transform((value) => ({
    email: value.email.toLowerCase(),
  }));

export const resetPasswordRequestSchema = z
  .object({
    token: trimmedNonEmptyStringSchema,
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  })
  .strict();

export const profileUpdateSchema = z
  .object({
    firstName: trimmedNonEmptyStringSchema,
    lastName: trimmedNonEmptyStringSchema,
  })
  .strict();

export const passwordUpdateSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis."),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  })
  .strict();

export const accountDeletionRequestSchema = z
  .object({
    reason: z.string().trim().max(2000, "Motif trop long.").optional(),
  })
  .strict();

export const legalHoldCreateSchema = z
  .object({
    targetType: z.enum(["user", "conversation", "application"]),
    targetId: z.coerce.number().int().positive("Cible invalide."),
    reason: z.string().trim().min(1, "Motif requis.").max(2000, "Motif trop long."),
  })
  .strict();

export const legalHoldTargetLookupQuerySchema = z
  .object({
    targetType: z.enum(["conversation", "application"]),
    q: z.string().trim().max(100, "Recherche trop longue.").optional(),
    limit: z.coerce.number().int().min(1).max(25).optional(),
  })
  .strict();

export const disclosureLogCreateSchema = z
  .object({
    requestType: z.enum(["authority_request", "litigation", "other"]).optional(),
    authorityName: z.string().trim().min(1, "Autorité requise.").max(255, "Autorité trop longue."),
    legalBasis: z.string().trim().max(500, "Base légale trop longue.").optional(),
    targetType: z.enum(["user", "conversation", "application", "export", "other"]),
    targetId: z.coerce.number().int().positive("Cible invalide.").optional(),
    scopeSummary: z.string().trim().min(1, "Périmètre requis.").max(4000, "Périmètre trop long."),
    exportReference: z.string().trim().max(255, "Référence trop longue.").optional(),
  })
  .strict();

export const accountDeletionReviewSchema = z
  .object({
    action: z.enum(["approve", "reject", "complete"]),
    reviewNote: z.string().trim().max(2000, "Note trop longue.").optional(),
  })
  .strict();

export const apiKeyCreateRequestSchema = z
  .object({
    name: trimmedNonEmptyStringSchema,
    expiresAt: z
      .union([z.string().datetime({ offset: true }), z.null(), z.undefined()])
      .optional(),
  })
  .strict();

export const positiveIntegerBodySchema = z.object({
  userId: z.coerce.number().int().positive("Identifiant invalide."),
}).strict();

export const positiveIntegerParamSchema = z.coerce.number().int().positive("Identifiant invalide.");

const jobInputSchema = z
  .object({
    id: z.string().trim().min(1, "Identifiant d'offre requis."),
    title: z.string().trim().min(1, "Intitulé requis."),
    company: z.string().optional(),
    location: z.string().trim().min(1, "Localisation requise."),
    contractType: z.string().trim().min(1, "Type de contrat requis.").transform(normalizeContractType),
    publicationDate: z.string().trim().min(1, "Date de publication requise."),
    url: z.string().trim().min(1, "Lien de l'offre requis."),
    description: z.string().optional(),
    source: jobSourceSchema,
    pdfUrl: z.string().optional(),
  })
  .strict();

export const trackedApplicationCreateRequestSchema = z
  .object({
    job: jobInputSchema,
    appliedAt: z.string().optional(),
    status: applicationStatusSchema.optional(),
    notes: z.string().optional().nullable(),
    proofs: z.string().optional().nullable(),
    interviewAt: z.string().optional().nullable(),
    interviewDetails: z.string().optional().nullable(),
  })
  .strict();

export const managedUserUpdateSchema = z
  .object({
    firstName: trimmedNonEmptyStringSchema,
    lastName: trimmedNonEmptyStringSchema,
    password: z.preprocess(
      (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
      z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").optional()
    ),
  })
  .strict();

export const applicationJobPatchSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    company: z.string().trim().optional(),
    location: z.string().trim().optional(),
    contractType: z.string().trim().optional(),
    url: z.string().trim().optional(),
    publicationDate: z.string().trim().optional(),
    description: z.string().trim().optional(),
    source: jobSourceSchema.optional(),
    pdfUrl: z.string().trim().optional(),
  })
  .strict();

export const applicationPatchSchema = z
  .object({
    status: applicationStatusSchema.optional(),
    notes: z.string().optional().nullable(),
    proofs: z.string().optional().nullable(),
    interviewAt: z.string().optional().nullable(),
    interviewDetails: z.string().optional().nullable(),
    lastFollowUpAt: z.string().optional().nullable(),
    followUpDueAt: z.string().optional(),
    followUpEnabled: z.boolean().optional(),
    appliedAt: z.string().optional(),
    job: applicationJobPatchSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Patch invalide.",
  });
export type ApplicationPatchInput = z.infer<typeof applicationPatchSchema>;

export const externalApplicationUpsertSchema = z
  .object({
    match: z.object({
      userId: z.number().int().positive(),
      jobId: z.string().trim().min(1),
    }),
    data: z
      .object({
        status: applicationStatusSchema.optional(),
        notes: z.string().optional().nullable(),
        proofs: z.string().optional().nullable(),
        interviewAt: z.string().optional().nullable(),
        interviewDetails: z.string().optional().nullable(),
        lastFollowUpAt: z.string().optional().nullable(),
        followUpDueAt: z.string().optional(),
        followUpEnabled: z.boolean().optional(),
        appliedAt: z.string().optional(),
        job: applicationJobPatchSchema.extend({
          title: z.string().trim().min(1),
        }),
      })
      .strict(),
  })
  .strict();
export type ExternalApplicationUpsertInput = z.infer<typeof externalApplicationUpsertSchema>;

export const textContentSchema = z
  .object({
    content: z.string(),
  })
  .strict();

export const coachNotesActionSchema = z
  .object({
    jobId: z.string().trim().min(1),
    action: z.enum(["save-private", "create-shared", "update-shared", "delete-shared"]),
    content: z.string().optional(),
    noteId: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      (value.action === "create-shared" || value.action === "update-shared") &&
      (!value.content || !value.content.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content"],
        message: "Contenu de note partagée requis.",
      });
    }

    if (
      (value.action === "update-shared" || value.action === "delete-shared") &&
      !value.noteId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["noteId"],
        message: "Identifiant de note requis.",
      });
    }
  });

export const coachImportRowSchema = z
  .object({
    company: z.string().optional(),
    contractType: z.string().optional(),
    title: z.string().optional(),
    location: z.string().optional(),
    appliedAt: z.string().optional(),
    status: applicationStatusSchema.optional(),
    notes: z.string().optional(),
  })
  .strict();

export const coachImportRequestSchema = z
  .object({
    dateFormat: z.enum(["dmy", "mdy"]).optional(),
    rows: z.array(coachImportRowSchema).min(1).max(500, "Impossible d'importer plus de 500 lignes à la fois."),
  })
  .strict();

export const coachGroupCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Nom de groupe requis.").max(200, "Nom de groupe trop long."),
  })
  .strict();

export const calendarSubscriptionCreateSchema = z
  .object({
    scope: z.enum(["group", "all_groups"]),
    groupId: z.number().int().positive().optional(),
    regenerate: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => data.scope !== "group" || (data.groupId !== undefined && data.groupId > 0),
    { message: "Identifiant de groupe requis pour un abonnement de groupe.", path: ["groupId"] }
  );

export const groupArchiveSchema = z
  .object({
    archived: z.boolean(),
  })
  .strict();

export const searchHistorySaveSchema = z
  .object({
    entry: searchHistoryEntrySchema,
  })
  .strict();

export const patchEnvelopeSchema = z
  .object({
    patch: applicationPatchSchema,
  })
  .strict();

export function parseIntegerParam(value: string) {
  const parsed = positiveIntegerParamSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function readValidatedJson<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema
): Promise<
  | { success: true; data: z.infer<TSchema> }
  | { success: false; error: string }
> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      error: "Corps JSON invalide.",
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Requête invalide.",
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}

export function normalizePatchedJob(jobId: string, job: z.infer<typeof applicationJobPatchSchema>): Job {
  return {
    id: jobId,
    title: job.title?.trim() || "",
    company: job.company?.trim() || undefined,
    location: job.location?.trim() || "Non précisé",
    contractType: job.contractType?.trim() || "Non précisé",
    publicationDate: job.publicationDate?.trim() || new Date().toISOString(),
    url: job.url?.trim() || "#",
    description: job.description?.trim() || undefined,
    source: job.source ?? "forem",
    pdfUrl: job.pdfUrl?.trim() || undefined,
  };
}

export function normalizeApplicationPatch(jobId: string, patch: ApplicationPatchInput) {
  const hasField = <TKey extends keyof ApplicationPatchInput>(key: TKey) =>
    Object.prototype.hasOwnProperty.call(patch, key);

  const normalizedPatch: {
    status?: ApplicationPatchInput["status"];
    notes?: ApplicationPatchInput["notes"];
    proofs?: ApplicationPatchInput["proofs"];
    interviewAt?: ApplicationPatchInput["interviewAt"];
    interviewDetails?: ApplicationPatchInput["interviewDetails"];
    lastFollowUpAt?: ApplicationPatchInput["lastFollowUpAt"];
    followUpDueAt?: ApplicationPatchInput["followUpDueAt"];
    followUpEnabled?: ApplicationPatchInput["followUpEnabled"];
    appliedAt?: ApplicationPatchInput["appliedAt"];
    job?: Job;
  } = {};

  if (hasField("status")) normalizedPatch.status = patch.status;
  if (hasField("notes")) normalizedPatch.notes = patch.notes;
  if (hasField("proofs")) normalizedPatch.proofs = patch.proofs;
  if (hasField("interviewAt")) normalizedPatch.interviewAt = patch.interviewAt;
  if (hasField("interviewDetails")) normalizedPatch.interviewDetails = patch.interviewDetails;
  if (hasField("lastFollowUpAt")) normalizedPatch.lastFollowUpAt = patch.lastFollowUpAt;
  if (hasField("followUpDueAt")) normalizedPatch.followUpDueAt = patch.followUpDueAt;
  if (hasField("followUpEnabled")) normalizedPatch.followUpEnabled = patch.followUpEnabled;
  if (hasField("appliedAt")) normalizedPatch.appliedAt = patch.appliedAt;
  if (hasField("job") && patch.job) normalizedPatch.job = normalizePatchedJob(jobId, patch.job);

  return normalizedPatch;
}
