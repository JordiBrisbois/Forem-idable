const DEFAULT_UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";

function isAllowedUmamiHost(hostname: string): boolean {
  return hostname === "cloud.umami.is" || hostname === "stats.brisbois.dev";
}

export function sanitizeUmamiScriptUrl(rawUrl?: string): string {
  const candidate = rawUrl?.trim() || DEFAULT_UMAMI_SCRIPT_URL;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") return "";
    if (!isAllowedUmamiHost(url.hostname)) return "";
    if (!url.pathname.endsWith("/script.js")) return "";
    return url.toString();
  } catch {
    return "";
  }
}
