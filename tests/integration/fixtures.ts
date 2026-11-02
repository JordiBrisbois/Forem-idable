import { describe } from "vitest";
import { db, ensureDatabase } from "@/lib/server/db";
import type { AuthUser, UserRole } from "@/types/auth";

/**
 * Shared setup for the Postgres-backed integration suites.
 *
 * The gate is RUN_DB_INTEGRATION, not DATABASE_URL: the `quality` CI job also
 * exports a DATABASE_URL (pointing at nothing, only needed by `next build`), so
 * the presence of that variable cannot mean "a server is reachable". Only the
 * `postgres` job sets RUN_DB_INTEGRATION=1.
 */
export const describeWithDatabase =
  process.env.RUN_DB_INTEGRATION === "1" ? describe : describe.skip;

/** Wipes every table the suites touch. CASCADE reaches the dependent tables
 *  (applications, messages, participants, reads, …). */
export async function resetDatabase() {
  await ensureDatabase();
  await db.query(
    "TRUNCATE TABLE users, coach_groups, conversations RESTART IDENTITY CASCADE"
  );
}

let sequence = 0;

function nextSequence() {
  // Unique per process so parallel files cannot collide on the unique email.
  sequence += 1;
  return `${process.pid}-${sequence}`;
}

export async function createUser<R extends UserRole = "user">(
  overrides: Partial<Pick<AuthUser, "firstName" | "lastName">> & { role?: R } = {}
): Promise<AuthUser & { role: R }> {
  const suffix = nextSequence();
  const email = `integration-${suffix}@forem.test`;
  const firstName = overrides.firstName ?? `Prénom${suffix}`;
  const lastName = overrides.lastName ?? "Test";
  const role = (overrides.role ?? "user") as R;

  const result = await db.query<{ id: string }>(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [email, "integration-not-a-real-hash", firstName, lastName, role]
  );

  return { id: Number(result.rows[0].id), email, firstName, lastName, role };
}

export async function createCoachGroup(options: {
  createdBy: AuthUser;
  name?: string;
  managerCoachUserId?: number | null;
}) {
  const result = await db.query<{ id: string }>(
    `INSERT INTO coach_groups (name, created_by, manager_coach_user_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [
      options.name ?? `Groupe ${nextSequence()}`,
      options.createdBy.id,
      options.managerCoachUserId ?? null,
    ]
  );

  return Number(result.rows[0].id);
}

export async function addGroupMember(groupId: number, userId: number) {
  await db.query(
    `INSERT INTO coach_group_members (group_id, user_id) VALUES ($1, $2)`,
    [groupId, userId]
  );
}

export async function addGroupCoach(groupId: number, userId: number) {
  await db.query(
    `INSERT INTO coach_group_coaches (group_id, user_id) VALUES ($1, $2)`,
    [groupId, userId]
  );
}

/** A coach group with one coach and one beneficiary, i.e. the smallest setup
 *  where direct messaging between the two is legitimate. */
export async function createGroupWithCoachAndMember() {
  const coach = await createUser({ role: "coach" });
  const member = await createUser();
  const groupId = await createCoachGroup({ createdBy: coach, managerCoachUserId: coach.id });
  await addGroupCoach(groupId, coach.id);
  await addGroupMember(groupId, member.id);

  return { coach, member, groupId };
}

export async function createDirectConversation(a: AuthUser, b: AuthUser) {
  const [userAId, userBId] = a.id < b.id ? [a.id, b.id] : [b.id, a.id];
  const result = await db.query<{ id: string }>(
    `INSERT INTO conversations (type, direct_user_a_id, direct_user_b_id, created_by_user_id)
     VALUES ('direct', $1, $2, $3)
     RETURNING id`,
    [userAId, userBId, a.id]
  );

  const conversationId = Number(result.rows[0].id);
  await db.query(
    `INSERT INTO conversation_participants (conversation_id, user_id, role_snapshot)
     VALUES ($1, $2, $3), ($1, $4, $5)`,
    [conversationId, a.id, a.role, b.id, b.role]
  );

  return conversationId;
}
