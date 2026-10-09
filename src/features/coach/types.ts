import { CoachGroupSummary, CoachUserSummary } from "@/types/coach";
import { CalendarSubscriptionScope } from "@/types/calendar";
import { BeneficiaryStage } from "@/types/beneficiaryStage";

export type CoachGroupedGroupKind = "standard" | "ungrouped";
export type CoachUserFilter =
  | "all"
  | "urgent"
  | "due"
  | "interviews"
  | "inactive"
  | "accepted"
  | "rejected";
export type CoachStageFilter = BeneficiaryStage | "all";

export interface CoachRemoveMembershipTarget {
  groupId: number;
  userId: number;
  userEmail: string;
  groupName: string;
}

export interface CoachRemoveCoachTarget {
  groupId: number;
  userId: number;
  userEmail: string;
  groupName: string;
}

export interface CoachManagerPickerGroup {
  id: number;
  name: string;
  coaches: CoachGroupSummary["coaches"];
}

export interface CoachRemoveGroupTarget {
  groupId: number;
  groupName: string;
}

export interface CoachEditTarget {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: CoachUserSummary["role"];
}

export interface CoachDeleteUserTarget {
  userId: number;
  email: string;
}

export interface CoachCalendarRegenerationTarget {
  scope: CalendarSubscriptionScope;
  groupId: number | null;
  label: string;
}

export interface CoachApiKeysTarget {
  userId: number;
  email: string;
  role: CoachUserSummary["role"];
}

export interface CoachRevokeApiKeyTarget {
  userId: number;
  keyId: number;
  keyName: string;
  email: string;
}

export type CoachUndoAction =
  | {
      type: "remove-membership";
      label: string;
      groupId: number;
      userId: number;
      groupName: string;
    };

export type CoachMemberPickerGroup = CoachGroupSummary;

export interface CoachArchiveGroupTarget {
  groupId: number;
  groupName: string;
  archived: boolean;
}

export interface CoachGroupedUserGroup {
  id: number;
  name: string;
  createdById: number | null;
  createdByLabel: string | null;
  managerCoachId: number | null;
  archivedAt: string | null;
  canAddMembers: boolean;
  canManageCoaches: boolean;
  kind: CoachGroupedGroupKind;
  totalApplications: number;
  totalInterviews: number;
  totalDue: number;
  totalAccepted: number;
  totalRejected: number;
  members: CoachUserSummary[];
  coaches: CoachGroupSummary["coaches"];
}
