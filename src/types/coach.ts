import { JobApplication } from "@/types/application";
import { AuthUser, UserRole } from "@/types/auth";

export type TrackingPhase =
  | "internship_search"
  | "job_search"
  | "placed"
  | "dropped";

export interface CoachGroupMember {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  lastSeenAt: string | null;
}

export interface CoachGroupSummary {
  id: number;
  name: string;
  createdAt: string;
  createdBy: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  managerCoachId: number | null;
  archivedAt: string | null;
  members: CoachGroupMember[];
  coaches: CoachGroupMember[];
}

export interface CoachUserSummary {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
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
  lastSeenAt: string | null;
  lastCoachActionAt: string | null;
  hasAcceptedStage: boolean;
  hasAcceptedJob: boolean;
  applications: JobApplication[];
}

export interface CoachDashboardData {
  viewer: AuthUser;
  users: CoachUserSummary[];
  groups: CoachGroupSummary[];
  availableCoaches: CoachGroupMember[];
}
