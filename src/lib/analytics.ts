const DEFAULT_UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";

function getAllowedUmamiHosts(): string[] {
  const raw = process.env.UMAMI_ALLOWED_HOSTS;
  const configured = (raw ?? "cloud.umami.is")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);

  return configured;
}

export function sanitizeUmamiScriptUrl(rawUrl?: string): string {
  const candidate = rawUrl?.trim() || DEFAULT_UMAMI_SCRIPT_URL;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") return "";
    if (!url.pathname.endsWith("/script.js")) return "";
    if (!getAllowedUmamiHosts().includes(url.hostname)) return "";
    return url.toString();
  } catch {
    return "";
  }
}
