import { hashPassword } from "@/lib/server/auth";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { ensureDatabase, orm } from "@/lib/server/db";
import { generateTemporaryPassword } from "@/lib/server/passwords";
import { users } from "@/lib/server/schema";
import { AuthUser } from "@/types/auth";
import { SearchGoal } from "@/types/preferences";

export interface CreatedAccount {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: AuthUser["role"];
  };
  /** Plaintext password, returned only once so the admin can share it. */
  temporaryPassword: string;
}

export interface CreateAccountInput {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  searchGoal?: SearchGoal;
}

async function createAccount(
  role: AuthUser["role"],
  input: CreateAccountInput
): Promise<CreatedAccount> {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const providedPassword = input.password?.trim();
  const temporaryPassword = providedPassword || generateTemporaryPassword();

  const [created] = await orm
    .insert(users)
    .values({
      email: input.email.trim().toLowerCase(),
      passwordHash: hashPassword(temporaryPassword),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      role,
      searchGoal: input.searchGoal ?? "job",
    })
    .returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    });

  return { user: created, temporaryPassword };
}

export async function createCoachAccount(
  actor: AuthUser & { role: "admin" },
  input: CreateAccountInput
): Promise<CreatedAccount> {
  const result = await createAccount("coach", input);
  await recordAuditEvent({
    actorUserId: actor.id,
    action: "admin_coach_created",
    targetUserId: result.user.id,
    payload: { toRole: "coach" },
  });
  return result;
}

export async function createBeneficiaryAccount(
  actor: AuthUser & { role: "admin" },
  input: CreateAccountInput
): Promise<CreatedAccount> {
  const result = await createAccount("user", input);
  await recordAuditEvent({
    actorUserId: actor.id,
    action: "admin_user_created",
    targetUserId: result.user.id,
    payload: { toRole: "user" },
  });
  return result;
}
