import { describe, expect, it } from "vitest";
import { canCoach, isAdmin, isBeneficiary, isCoach } from "@/lib/authz";

describe("authz predicates", () => {
  it("treats admin as a superset of coach", () => {
    expect(canCoach("admin")).toBe(true);
    expect(canCoach("coach")).toBe(true);
    expect(canCoach("user")).toBe(false);
    expect(canCoach(null)).toBe(false);
    expect(canCoach(undefined)).toBe(false);
  });

  it("distinguishes exact roles", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("coach")).toBe(false);
    expect(isCoach("coach")).toBe(true);
    expect(isCoach("admin")).toBe(false);
    expect(isBeneficiary("user")).toBe(true);
    expect(isBeneficiary("admin")).toBe(false);
  });
});
