import { Job } from "@/types/job";
import { UserRole } from "@/types/auth";
import type { ApplicationSourceType } from "@/lib/applications/sourceType";

export type ApplicationStatus =
  | "in_progress"
  | "follow_up"
  | "interview"
  | "accepted"
  | "rejected";

export type ContractType =
  | "STAGE"
  | "CDI"
  | "CDD"
  | "ALTERNANCE"
  | "INTERIM"
  | "FREELANCE"
  | "VIE"
  | "CONTRAT_PRO"
  | "AUTRE";

export type CoachNoteAuthorRole = Extract<UserRole, "coach" | "admin"> | "system";

export interface CoachNoteAuthor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: CoachNoteAuthorRole;
}

export interface CoachSharedNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: CoachNoteAuthor;
  contributors: CoachNoteAuthor[];
}

export interface CoachPrivateNote {
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: CoachNoteAuthor;
  contributors: CoachNoteAuthor[];
}

export interface JobApplication {
  job: Job;
  sourceType?: ApplicationSourceType;
  appliedAt: string;
  followUpDueAt: string;
  followUpEnabled?: boolean;
  lastFollowUpAt?: string | null;
  status: ApplicationStatus;
  notes?: string | null;
  proofs?: string | null;
  privateCoachNote?: CoachPrivateNote;
  sharedCoachNotes?: CoachSharedNote[];
  interviewAt?: string | null;
  interviewDetails?: string | null;
  updatedAt: string;
}

export type JobApplicationPatch = Partial<
  Pick<
    JobApplication,
    | "status"
    | "notes"
    | "proofs"
    | "interviewAt"
    | "interviewDetails"
    | "lastFollowUpAt"
    | "followUpDueAt"
    | "followUpEnabled"
    | "appliedAt"
  >
> & {
  job?: Partial<Omit<Job, "id">>;
};
