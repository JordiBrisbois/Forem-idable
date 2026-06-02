import { get, post, patch, del } from "@/lib/api/client";
import { ApiKeySummary } from "@/types/externalApi";
import { AuthUser } from "@/types/auth";
import {
  DataExportRequestSummary,
  AccountDeletionRequestSummary,
} from "@/app/account/account.schemas";

export type ProfilePayload = {
  firstName: string;
  lastName: string;
};

export type PasswordPayload = {
  currentPassword: string;
  password: string;
};

export function fetchAccountApiKeys() {
  return get<{ apiKeys?: ApiKeySummary[] }>("/api/account/api-keys", { cache: "no-store" });
}

export function createAccountApiKey(payload: { name: string; expiresAt: string | null }) {
  return post<{ apiKey?: ApiKeySummary; plainTextKey?: string }>("/api/account/api-keys", payload);
}

export function revokeAccountApiKey(keyId: number) {
  return del<Record<string, never>>(`/api/account/api-keys/${keyId}`);
}

export function updateProfile(payload: ProfilePayload) {
  return patch<{ user?: AuthUser }>("/api/account", payload);
}

export function updatePassword(payload: PasswordPayload) {
  return patch<{ error?: string }>("/api/account/password", payload);
}

export function fetchDataExportRequests() {
  return get<{ requests?: DataExportRequestSummary[] }>("/api/account/data-export");
}

export function generateDataExport() {
  return post<{ request?: DataExportRequestSummary }>("/api/account/data-export");
}

export function fetchDeletionRequests() {
  return get<{ requests?: AccountDeletionRequestSummary[] }>("/api/account/deletion-request");
}

export function submitDeletionRequest(reason?: string) {
  return post<{ request?: AccountDeletionRequestSummary }>("/api/account/deletion-request", {
    reason: reason?.trim() || undefined,
  });
}

export function cancelDeletionRequest() {
  return del<{ request?: AccountDeletionRequestSummary }>("/api/account/deletion-request");
}
