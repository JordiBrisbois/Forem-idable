import { ApiError } from "./errors";

export interface ApiResponse<T> {
  response: Response;
  data: T;
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => ({}))) as T;

  if (!response.ok) {
    const errorMessage =
      (data as Record<string, unknown>)?.error ??
      `Request failed with status ${response.status}`;
    throw new ApiError(String(errorMessage), response.status);
  }

  return { response, data };
}

function jsonInit(method: string, body?: unknown): RequestInit {
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return init;
}

export function get<T>(url: string, init?: RequestInit) {
  return requestJson<T>(url, { ...init, method: "GET" });
}

export function post<T>(url: string, body?: unknown, init?: RequestInit) {
  return requestJson<T>(url, { ...jsonInit("POST", body), ...init });
}

export function patch<T>(url: string, body?: unknown, init?: RequestInit) {
  return requestJson<T>(url, { ...jsonInit("PATCH", body), ...init });
}

export function put<T>(url: string, body?: unknown, init?: RequestInit) {
  return requestJson<T>(url, { ...jsonInit("PUT", body), ...init });
}

export function del<T>(url: string, init?: RequestInit) {
  return requestJson<T>(url, { ...init, method: "DELETE" });
}
