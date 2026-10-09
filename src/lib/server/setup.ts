import { sql } from "drizzle-orm";
import { createSession, getUserCount, hashPassword } from "@/lib/server/auth";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { ensureDatabase, orm } from "@/lib/server/db";
import { users } from "@/lib/server/schema";
import { SearchGoal } from "@/types/preferences";

export async function isSetupRequired(): Promise<boolean> {
  try {
    return (await getUserCount()) === 0;
  } catch {
    // If the database is unreachable, don't trap users in a setup redirect loop.
    return false;
  }
}

export interface CreateFirstAdminInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  searchGoal?: SearchGoal;
}

/**
 * Creates the very first account (an admin). Serialized with an advisory lock
 * and refuses to run if any user already exists, so a fresh instance cannot be
 * hijacked after setup.
 */
export async function createFirstAdmin(input: CreateFirstAdminInput) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const email = input.email.trim().toLowerCase();
  const passwordHash = hashPassword(input.password);

  const admin = await orm.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${4_016_001})`);

    const [row] = await tx.select({ count: sql<string>`COUNT(*)::text` }).from(users);
    if (Number(row?.count ?? "0") > 0) {
      throw new Error("AlreadySetup");
    }

    const [created] = await tx
      .insert(users)
      .values({
        email,
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        role: "admin",
        searchGoal: input.searchGoal ?? "job",
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      });

    return created;
  });

  await recordAuditEvent({
    actorUserId: admin.id,
    action: "admin_role_changed",
    targetUserId: admin.id,
    payload: { bootstrap: true, toRole: "admin" },
  });

  await createSession(admin.id);

  return admin;
}
