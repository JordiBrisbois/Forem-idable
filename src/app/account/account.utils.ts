import { ApiKeyFormValues } from "./account.schemas";

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fr-FR");
}

export function isApiKeyExpiry(value: string): value is ApiKeyFormValues["expiry"] {
  return value === "none" || value === "30" || value === "90" || value === "365";
}

export function buildApiKeyExpiryDate(expiry: ApiKeyFormValues["expiry"]) {
  if (expiry === "none") {
    return null;
  }

  return new Date(Date.now() + Number(expiry) * 24 * 60 * 60 * 1000).toISOString();
}
