import { get, post } from "@/lib/api/client";
import { AuthUser } from "@/types/auth";
import { SearchGoal } from "@/types/preferences";

export function fetchSetupStatus() {
  return get<{ needsSetup: boolean }>("/api/setup/status", { cache: "no-store" });
}

export function submitSetup(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  searchGoal?: SearchGoal;
}) {
  return post<{ user?: AuthUser }>("/api/setup", payload);
}
