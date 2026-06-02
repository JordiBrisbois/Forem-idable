import { get, post, patch, del } from "@/lib/api/client";
import { FeaturedSearchPayload } from "@/features/featured-searches/featuredSearchSchema";
import { CoachDashboardData } from "@/types/coach";
import { AdminApiKeySummary } from "@/types/externalApi";
import { FeaturedSearch } from "@/types/featuredSearch";

export type AdminAccountDeletionRequest = {
  id: number;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  reason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  reviewNote: string | null;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
};

export type AdminLegalHold = {
  id: number;
  targetType: "user" | "conversation" | "application";
  targetId: number;
  reason: string;
  createdAt: string;
  releasedAt: string | null;
};

export type AdminDisclosureLog = {
  id: number;
  requestType: "authority_request" | "litigation" | "other";
  authorityName: string;
  legalBasis: string | null;
  targetType: "user" | "conversation" | "application" | "export" | "other";
  targetId: number | null;
  scopeSummary: string;
  exportReference: string | null;
  createdByUserId: number | null;
  createdAt: string;
};

export type AdminAuditLog = {
  id: number;
  action: string;
  createdAt: string;
  payload: Record<string, unknown>;
  actor: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  targetUser: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  group: {
    id: number;
    name: string;
  } | null;
};

export type AdminLegalHoldTargetOption = {
  id: number;
  label: string;
  description: string | null;
};

export function fetchAdminDashboard() {
  return get<{ error?: string; dashboard?: CoachDashboardData }>("/api/coach/dashboard", {
    cache: "no-store",
  });
}

export function promoteCoachRole(userId: number) {
  return post<{ error?: string; ok?: boolean }>("/api/admin/coaches", { userId });
}

export function demoteCoachRole(userId: number) {
  return del<{ error?: string; ok?: boolean }>(`/api/admin/coaches?userId=${userId}`);
}

export function fetchAdminApiKeys() {
  return get<{ error?: string; apiKeys?: AdminApiKeySummary[] }>("/api/admin/api-keys", {
    cache: "no-store",
  });
}

export function revokeAdminApiKey(keyId: number) {
  return del<{ error?: string; ok?: boolean }>(`/api/admin/api-keys/${keyId}`);
}

export function fetchAdminFeaturedSearches() {
  return get<{ error?: string; featuredSearches?: FeaturedSearch[] }>(
    "/api/admin/featured-searches",
    { cache: "no-store" }
  );
}

export function createAdminFeaturedSearch(payload: FeaturedSearchPayload) {
  return post<{ error?: string; featuredSearch?: FeaturedSearch }>(
    "/api/admin/featured-searches",
    payload
  );
}

export function updateAdminFeaturedSearch(id: number, payload: FeaturedSearchPayload) {
  return patch<{ error?: string; featuredSearch?: FeaturedSearch }>(
    `/api/admin/featured-searches/${id}`,
    payload
  );
}

export function deleteAdminFeaturedSearch(id: number) {
  return del<{ error?: string; ok?: boolean }>(`/api/admin/featured-searches/${id}`);
}

export function fetchAdminAccountDeletionRequests() {
  return get<{ error?: string; requests?: AdminAccountDeletionRequest[] }>(
    "/api/admin/account-deletion-requests",
    { cache: "no-store" }
  );
}

export function reviewAdminAccountDeletionRequest(
  id: number,
  payload: { action: "approve" | "reject" | "complete"; reviewNote?: string }
) {
  return patch<{
    error?: string;
    request?: AdminAccountDeletionRequest | null;
    deletedUserId?: number | null;
  }>(`/api/admin/account-deletion-requests/${id}`, payload);
}

export function fetchAdminLegalHolds() {
  return get<{ error?: string; holds?: AdminLegalHold[] }>("/api/admin/legal-holds", {
    cache: "no-store",
  });
}

export function fetchAdminLegalHoldTargetOptions(
  targetType: "conversation" | "application",
  search?: string
) {
  const params = new URLSearchParams({ targetType });
  if (search?.trim()) {
    params.set("q", search.trim());
  }

  return get<{ error?: string; options?: AdminLegalHoldTargetOption[] }>(
    `/api/admin/legal-hold-targets?${params.toString()}`,
    { cache: "no-store" }
  );
}

export function createAdminLegalHold(payload: {
  targetType: "user" | "conversation" | "application";
  targetId: number;
  reason: string;
}) {
  return post<{ error?: string; hold?: AdminLegalHold }>("/api/admin/legal-holds", payload);
}

export function releaseAdminLegalHold(id: number) {
  return del<{ error?: string; hold?: AdminLegalHold }>(`/api/admin/legal-holds/${id}`);
}

export function fetchAdminDisclosureLogs() {
  return get<{ error?: string; logs?: AdminDisclosureLog[] }>("/api/admin/disclosure-logs", {
    cache: "no-store",
  });
}

export function fetchAdminAuditLogs(limit = 200) {
  return get<{ error?: string; logs?: AdminAuditLog[] }>(
    `/api/admin/audit-logs?limit=${encodeURIComponent(String(limit))}`,
    { cache: "no-store" }
  );
}

export function createAdminDisclosureLog(payload: {
  requestType?: "authority_request" | "litigation" | "other";
  authorityName: string;
  legalBasis?: string;
  targetType: "user" | "conversation" | "application" | "export" | "other";
  targetId?: number;
  scopeSummary: string;
  exportReference?: string;
}) {
  return post<{
    error?: string;
    log?: { id: number; createdAt: string };
  }>("/api/admin/disclosure-logs", payload);
}
