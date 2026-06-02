import { ApplicationStatus, JobApplication } from "@/types/application";
import { TrackingPhase } from "@/types/coach";
import { UserRole } from "@/types/auth";

export interface ApiKeySummary {
  id: number;
  name: string;
  keyPrefix: string;
  lastFour: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface AdminApiKeySummary extends ApiKeySummary {
  userId: number;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userRole: UserRole;
}

export interface ApiKeyCreateResult {
  apiKey: ApiKeySummary;
  plainTextKey: string;
}

export interface ExternalApiActor {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Extract<UserRole, "coach" | "admin">;
}

export interface ExternalApiApplicationRow {
  applicationId: number;
  userId: number;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userRole: UserRole;
  groupIds: number[];
  groupNames: string[];
  isFollowUpDue: boolean;
  isInterviewScheduled: boolean;
  application: JobApplication;
}

export interface ExternalApiApplicationDetail {
  applicationId: number;
  userId: number;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userRole: UserRole;
  groupIds: number[];
  groupNames: string[];
  isFollowUpDue: boolean;
  isInterviewScheduled: boolean;
  application: JobApplication;
}

export interface ExternalApiUserSummary {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  trackingPhase: TrackingPhase;
  groupIds: number[];
  groupNames: string[];
  applicationCount: number;
  interviewCount: number;
  dueCount: number;
  acceptedCount: number;
  rejectedCount: number;
  inProgressCount: number;
  latestActivityAt: string | null;
  applications?: JobApplication[];
}

export type ExternalApiUserDetail = ExternalApiUserSummary;

export interface ExternalApiGroupCoachSummary {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: Extract<UserRole, "coach" | "admin">;
  isManager: boolean;
}

export interface ExternalApiGroupSummary {
  id: number;
  name: string;
  createdAt: string;
  archivedAt: string | null;
  createdBy: {
    id: number;
    email: string;
  };
  managerCoachId: number | null;
  manager: ExternalApiGroupCoachSummary | null;
  coachCount: number;
  coaches: ExternalApiGroupCoachSummary[];
  memberCount: number;
  totalApplications: number;
  totalInterviews: number;
  members?: ExternalApiUserSummary[];
}

export interface ExternalApiStats {
  userCount: number;
  groupCount: number;
  applicationCount: number;
  interviewCount: number;
  dueCount: number;
}

export interface ExternalApiUsersResponse {
  actor: ExternalApiActor;
  stats: ExternalApiStats;
  users: ExternalApiUserSummary[];
}

export interface ExternalApiGroupsResponse {
  actor: ExternalApiActor;
  stats: ExternalApiStats;
  groups: ExternalApiGroupSummary[];
}

export interface ExternalApiApplicationsResponse {
  actor: ExternalApiActor;
  stats: ExternalApiStats;
  applications: ExternalApiApplicationRow[];
}

export interface ExternalApiMutationResponse {
  actor: ExternalApiActor;
  created?: boolean;
  application: ExternalApiApplicationDetail;
}

export interface ExternalApiFilters {
  search?: string;
  groupId?: number | null;
  userId?: number | null;
  role?: UserRole | null;
  status?: ApplicationStatus | null;
  dueOnly?: boolean;
  interviewOnly?: boolean;
  updatedAfter?: string | null;
  updatedBefore?: string | null;
  appliedAfter?: string | null;
  appliedBefore?: string | null;
  hasPrivateNote?: boolean;
  hasSharedNotes?: boolean;
  limit?: number;
  offset?: number;
  includeApplications?: boolean;
  includePrivateNote?: boolean;
  includeSharedNotes?: boolean;
  includeContributors?: boolean;
}
