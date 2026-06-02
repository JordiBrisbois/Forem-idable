import { get, post, patch } from "@/lib/api/client";
import { ApiKeySummary } from "@/types/externalApi";
import { JobApplication } from "@/types/application";
import { CalendarSubscriptionSummary } from "@/types/calendar";
import { CoachDashboardData } from "@/types/coach";

export async function fetchCoachDashboard() {
  return get<{ error?: string; dashboard?: CoachDashboardData }>("/api/coach/dashboard", {
    cache: "no-store",
  });
}

export async function requestCoachApplicationNote(input: {
  userId: number;
  jobId: string;
  action: "save-private" | "create-shared" | "update-shared" | "delete-shared";
  content?: string;
  noteId?: string;
}) {
  return patch<{ error?: string; application?: JobApplication }>(
    `/api/coach/users/${input.userId}/applications`,
    {
      jobId: input.jobId,
      action: input.action,
      content: input.content,
      noteId: input.noteId,
    }
  );
}

export async function fetchManagedUserApiKeys(userId: number) {
  return get<{ error?: string; apiKeys?: ApiKeySummary[] }>(
    `/api/admin/users/${userId}/api-keys`,
    { cache: "no-store" }
  );
}

export async function requestCalendarSubscription(input: {
  scope: "group" | "all_groups";
  groupId?: number | null;
  regenerate?: boolean;
}) {
  return post<{ error?: string; subscription?: CalendarSubscriptionSummary }>(
    "/api/coach/calendar-subscriptions",
    {
      scope: input.scope,
      groupId: input.groupId,
      regenerate: input.regenerate === true,
    }
  );
}
