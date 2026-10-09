import { UserRole } from "@/types/auth";

/**
 * Single source of truth for role checks. Admin is a superset of coach.
 * NEVER compare roles inline (`role === "coach"`) elsewhere — use these.
 * Declared as type guards so they also narrow the role type.
 */

export function isAdmin(role?: UserRole | null): role is "admin" {
  return role === "admin";
}

export function isCoach(role?: UserRole | null): role is "coach" {
  return role === "coach";
}

/** Coach-capable: a coach OR an admin. */
export function canCoach(role?: UserRole | null): role is "coach" | "admin" {
  return role === "coach" || role === "admin";
}

/** A plain beneficiary account. */
export function isBeneficiary(role?: UserRole | null): role is "user" {
  return role === "user";
}
