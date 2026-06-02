import { JobApplication } from "@/types/application";

export type CalendarSubscriptionScope = "group" | "all_groups";

export interface CalendarSubscriptionSummary {
  scope: CalendarSubscriptionScope;
  groupId: number | null;
  groupName: string | null;
  keyPrefix: string;
  lastFour: string;
  createdAt: string;
  lastUsedAt: string | null;
  path: string;
}

export interface CalendarFeedApplicationRow {
  userId: number;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  groupNames: string[];
  application: JobApplication;
}
