import { AdminDisclosureLog, AdminLegalHold } from "@/features/admin/adminApi";

export function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("fr-FR");
}

export function formatLegalHoldTarget(targetType: AdminLegalHold["targetType"]) {
  switch (targetType) {
    case "conversation":
      return "Conversation";
    case "application":
      return "Candidature";
    case "user":
      return "Utilisateur";
  }
}

export function formatDisclosureRequestType(type: AdminDisclosureLog["requestType"]) {
  switch (type) {
    case "authority_request":
      return "Autorité";
    case "litigation":
      return "Litige";
    case "other":
      return "Autre";
  }
}

export function formatDisclosureTargetType(type: AdminDisclosureLog["targetType"]) {
  switch (type) {
    case "user":
      return "Utilisateur";
    case "conversation":
      return "Conversation";
    case "application":
      return "Candidature";
    case "export":
      return "Export";
    case "other":
      return "Autre";
    default:
      return "Utilisateur";
  }
}

export type AdminLegalHoldUserTarget = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export type AdminLegalHoldSelectableTarget = {
  id: number;
  label: string;
  description: string | null;
};

export function getUserTargetLabel(user: AdminLegalHoldUserTarget) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.email;
}
