import { describe, expect, it } from "vitest";
import {
  canManageCoachAssignments,
  canManageCoachGroup,
  canRemoveCoachAssignmentFromGroup,
} from "@/lib/server/coachGroups";

const admin = {
  id: 1,
  email: "admin@example.test",
  firstName: "Ada",
  lastName: "Admin",
  role: "admin" as const,
};

/**
 * An admin must be able to manage any class without a DB round-trip (the checks
 * short-circuit on `isAdmin`). These guard the regression where an admin could
 * not remove a coach (including themselves) or delete a class in the admin UI.
 */
describe("admin class management permissions", () => {
  it("can manage coach assignments of any class", async () => {
    await expect(canManageCoachAssignments(admin, 42)).resolves.toBe(true);
  });

  it("can remove a coach assignment (including their own)", async () => {
    await expect(canRemoveCoachAssignmentFromGroup(admin, 42)).resolves.toBe(true);
  });

  it("can manage the class (rename/archive/delete scope)", async () => {
    await expect(canManageCoachGroup(admin, 42)).resolves.toBe(true);
  });
});
