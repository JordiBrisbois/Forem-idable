import { z } from "zod";
import { JobApplication } from "@/types/application";

const jobSourceSchema = z.enum(["forem", "linkedin", "indeed", "adzuna"]);
const applicationStatusSchema = z.enum([
  "in_progress",
  "follow_up",
  "interview",
  "accepted",
  "rejected",
]);
const coachNoteAuthorRoleSchema = z.enum(["coach", "admin", "system"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractStoredApplicationLogMetadata(value: unknown, context: string) {
  const jobId =
    isRecord(value) && isRecord(value.job) && typeof value.job.id === "string" ? value.job.id : null;

  const userIdMatch = context.match(/(?:^|:)user:(\d+)(?::|$)/);
  const coachDashboardMatch = context.match(/^coach-dashboard:(\d+)$/);
  const coachUpdateMatch = context.match(/^coach-update:(\d+):/);

  return {
    context,
    userId: userIdMatch?.[1] ?? coachDashboardMatch?.[1] ?? coachUpdateMatch?.[1] ?? null,
    jobId,
  };
}

const coachNoteAuthorSchema = z
  .object({
    id: z.number().int(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    role: coachNoteAuthorRoleSchema,
  })
  .passthrough();

const coachSharedNoteSchema = z
  .object({
    id: z.string(),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: coachNoteAuthorSchema,
    contributors: z.array(coachNoteAuthorSchema),
  })
  .passthrough();

const coachPrivateNoteSchema = z
  .object({
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: coachNoteAuthorSchema,
    contributors: z.array(coachNoteAuthorSchema),
  })
  .passthrough();

const jobSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    company: z.string().optional(),
    location: z.string(),
    contractType: z.string(),
    publicationDate: z.string(),
    url: z.string(),
    description: z.string().optional(),
    source: jobSourceSchema,
    pdfUrl: z.string().optional(),
  })
  .passthrough();

export const jobApplicationSchema = z
  .object({
    job: jobSchema,
    sourceType: z.enum(["manual", "tracked"]).optional(),
    appliedAt: z.string(),
    followUpDueAt: z.string(),
    followUpEnabled: z.boolean().optional(),
    lastFollowUpAt: z.string().nullable().optional(),
    status: applicationStatusSchema,
    notes: z.string().nullable().optional(),
    proofs: z.string().nullable().optional(),
    privateCoachNote: coachPrivateNoteSchema.optional(),
    sharedCoachNotes: z.array(coachSharedNoteSchema).optional(),
    interviewAt: z.string().nullable().optional(),
    interviewDetails: z.string().nullable().optional(),
    updatedAt: z.string(),
  })
  .passthrough();

export function parseStoredJobApplication(value: unknown, context: string): JobApplication {
  const parsed = jobApplicationSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid stored application payload (${context})`);
  }

  return parsed.data as JobApplication;
}

export function safeParseStoredJobApplication(value: unknown, context: string) {
  const parsed = jobApplicationSchema.safeParse(value);
  if (!parsed.success) {
    const metadata = extractStoredApplicationLogMetadata(value, context);
    console.warn("Skipping invalid stored application payload", {
      ...metadata,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join(".") || "<root>",
        code: issue.code,
        message: issue.message,
      })),
    });
    return null;
  }

  return parsed.data as JobApplication;
}
