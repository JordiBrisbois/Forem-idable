import { serverConfig } from "@/config/runtime.server";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { and, eq, gt, isNotNull, or, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { ensureDatabase, orm } from "@/lib/server/db";
import { passwordResetTokens, sessions, users } from "@/lib/server/schema";
import { AuthUser } from "@/types/auth";
import { anonymizeAuditLogsForUser } from "@/lib/server/auditLog";

const SESSION_COOKIE = serverConfig.app.sessionCookieName;
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
const PASSWORD_RESET_DURATION_MS = 1000 * 60 * 60;

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(":");
  if (!salt || !expectedHash) return false;

  const passwordHash = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");

  return expected.length === passwordHash.length && timingSafeEqual(passwordHash, expected);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeProfileValue(value: string) {
  return value.trim();
}

export async function getUserPasswordHash(userId: number): Promise<string | null> {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [row] = await orm
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row?.passwordHash ?? null;
}

export async function createUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const normalizedEmail = normalizeEmail(email);
  const passwordHash = hashPassword(password);
  const normalizedFirstName = normalizeProfileValue(firstName);
  const normalizedLastName = normalizeProfileValue(lastName);

  return orm.transaction(async (tx) => {
    // Serialize first-user bootstrap so only one account can become admin.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${4_016_001})`);

    const [{ count }] = await tx.select({ count: sql<string>`COUNT(*)::text` }).from(users);
    const nextRole: AuthUser["role"] = count === "0" ? "admin" : "user";

    const [createdUser] = await tx
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        role: nextRole,
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      });

    return createdUser;
  });
}

export async function authenticateUser(email: string, password: string) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const normalizedEmail = normalizeEmail(email);
  const [user] = await orm
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}

export async function createSession(userId: number) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await orm.insert(sessions).values({
    tokenHash,
    userId,
    expiresAt,
  });

  await orm.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, userId));

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token && orm) {
    await ensureDatabase();
    await orm.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!orm) return null;

  await ensureDatabase();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [user] = await orm
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (user) {
    const now = new Date();
    await orm.update(users).set({ lastSeenAt: now }).where(eq(users.id, user.id));

    const newExpiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
    await orm
      .update(sessions)
      .set({ expiresAt: newExpiresAt })
      .where(eq(sessions.tokenHash, hashToken(token)));

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: newExpiresAt,
    });
  }

  return user ?? null;
}

export async function setUserPassword(userId: number, password: string) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const passwordHash = hashPassword(password);
  await orm.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function createPasswordResetToken(email: string) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const normalizedEmail = normalizeEmail(email);
  const [user] = await orm
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) return null;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_DURATION_MS);

  await orm.delete(passwordResetTokens).where(
    or(
      eq(passwordResetTokens.userId, user.id),
      sql`${passwordResetTokens.expiresAt} <= NOW()`,
      isNotNull(passwordResetTokens.usedAt)
    )
  );

  await orm.insert(passwordResetTokens).values({
    tokenHash: hashToken(token),
    userId: user.id,
    expiresAt,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    expiresAt: expiresAt.toISOString(),
  };
}

export async function resetPasswordWithToken(token: string, password: string) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const tokenHash = hashToken(token);
  const passwordHash = hashPassword(password);

  return orm.transaction(async (tx) => {
    const result = await tx.execute(sql<{ userId: number }>`
      SELECT user_id AS "userId"
      FROM password_reset_tokens
      WHERE token_hash = ${tokenHash}
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
      FOR UPDATE
    `);

    const row = result.rows[0] as { userId: number } | undefined;
    if (!row) {
      return false;
    }

    await tx.update(users).set({ passwordHash }).where(eq(users.id, row.userId));
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.tokenHash, tokenHash));
    await tx.delete(sessions).where(eq(sessions.userId, row.userId));

    return true;
  });
}

export async function updateUserProfile(userId: number, firstName: string, lastName: string) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  await orm
    .update(users)
    .set({
      firstName: normalizeProfileValue(firstName),
      lastName: normalizeProfileValue(lastName),
    })
    .where(eq(users.id, userId));
}

export async function deleteUserAccount(userId: number) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  await anonymizeAuditLogsForUser(userId);
  await orm.delete(users).where(eq(users.id, userId));
}
