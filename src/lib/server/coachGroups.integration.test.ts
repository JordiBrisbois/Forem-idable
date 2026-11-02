// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import {
  addCoachToGroup,
  addUserToCoachGroup,
  archiveCoachGroup,
  canAccessCoachUser,
  canManageCoachAssignments,
  canManageCoachGroup,
  createCoachGroup,
  getManagedGroupIdsForCoach,
  removeUserFromCoachGroup,
} from "@/lib/server/coachGroups";
import {
  addGroupCoach,
  addGroupMember,
  createCoachGroup as insertCoachGroup,
  createGroupWithCoachAndMember,
  createUser,
  describeWithDatabase,
  resetDatabase,
} from "@/lib/server/testFixtures";

/**
 * These functions decide who may read a beneficiary's data, so the matrix is
 * worth checking against real rows: the queries join group membership and coach
 * assignment, which a mock can only pretend to reproduce.
 */
describeWithDatabase("coachGroups permissions (integration)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("lets an assigned coach manage the group, and nobody else", async () => {
    const { coach, groupId } = await createGroupWithCoachAndMember();
    const otherCoach = await createUser({ role: "coach" });
    const admin = await createUser({ role: "admin" });

    expect(await canManageCoachGroup(coach, groupId)).toBe(true);
    expect(await canManageCoachGroup(otherCoach, groupId)).toBe(false);
    // Admins short-circuit before touching the database.
    expect(await canManageCoachGroup(admin, groupId)).toBe(true);
  });

  it("reserves coach assignment changes for the group manager", async () => {
    const manager = await createUser({ role: "coach" });
    const assignedCoach = await createUser({ role: "coach" });
    const groupId = await insertCoachGroup({ createdBy: manager, managerCoachUserId: manager.id });
    await addGroupCoach(groupId, assignedCoach.id);

    // Being a coach of the group is not enough to hand out assignments.
    expect(await canManageCoachGroup(assignedCoach, groupId)).toBe(true);
    expect(await canManageCoachAssignments(assignedCoach, groupId)).toBe(false);
    expect(await canManageCoachAssignments(manager, groupId)).toBe(true);
  });

  it("scopes a coach's visibility to their own group members", async () => {
    const { coach, member, groupId } = await createGroupWithCoachAndMember();
    const otherCoach = await createUser({ role: "coach" });
    const otherMember = await createUser();
    const otherGroupId = await insertCoachGroup({ createdBy: otherCoach });
    await addGroupCoach(otherGroupId, otherCoach.id);
    await addGroupMember(otherGroupId, otherMember.id);

    expect(groupId).not.toBe(otherGroupId);
    expect(await canAccessCoachUser(coach, member.id)).toBe(true);
    expect(await canAccessCoachUser(coach, otherMember.id)).toBe(false);
    expect(await canAccessCoachUser(otherCoach, member.id)).toBe(false);
  });

  it("creates a group and grants access through the real write path", async () => {
    const coach = await createUser({ role: "coach" });
    const beneficiary = await createUser();

    const created = await createCoachGroup("Groupe retour à l'emploi", coach);
    const groupId = Number(created.id);
    await addUserToCoachGroup(groupId, beneficiary.id, coach);

    expect(await canManageCoachGroup(coach, groupId)).toBe(true);
    expect(await canAccessCoachUser(coach, beneficiary.id)).toBe(true);
    expect(await getManagedGroupIdsForCoach(coach.id)).toContain(groupId);

    // Regression: the manager check used to compare a bigint string with a
    // number, so a group creator could not archive their own group.
    await expect(archiveCoachGroup(groupId, true, coach)).resolves.toBeUndefined();

    await removeUserFromCoachGroup(groupId, beneficiary.id, coach);
    expect(await canAccessCoachUser(coach, beneficiary.id)).toBe(false);
  });

  it("forbids group writes from a coach who does not manage it", async () => {
    const { groupId } = await createGroupWithCoachAndMember();
    const outsider = await createUser({ role: "coach" });
    const candidate = await createUser();

    await expect(addUserToCoachGroup(groupId, candidate.id, outsider)).rejects.toThrow(
      "Forbidden"
    );
    await expect(addCoachToGroup(groupId, outsider.id, outsider)).rejects.toThrow("Forbidden");
    await expect(archiveCoachGroup(groupId, true, outsider)).rejects.toThrow("Forbidden");
  });
});
