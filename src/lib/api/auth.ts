import { get, post } from "@/lib/api/client";
import { AuthUser } from "@/types/auth";

export function fetchCurrentUser() {
  return get<{ user?: AuthUser | null }>("/api/auth/me", { cache: "no-store" });
}

export function logoutUser() {
  return post<{ ok?: boolean }>("/api/auth/logout");
}

export function requestPasswordReset(email: string) {
  return post<{ message?: string }>("/api/auth/forgot-password", { email });
}

export function resetPassword(token: string, password: string) {
  return post<Record<string, never>>("/api/auth/reset-password", { token, password });
}

export function loginUser(payload: { email: string; password: string }) {
  return post<{ user?: AuthUser }>("/api/auth/login", payload);
}

export function registerUser(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  return post<{ user?: AuthUser }>("/api/auth/register", payload);
}
