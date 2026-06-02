import { createHash, randomBytes } from "crypto";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { headers } from "next/headers";
import { ensureDatabase, orm } from "@/lib/server/db";
import { apiKeys, users } from "@/lib/server/schema";
import {
  AdminApiKeySummary,
  ApiKeyCreateResult,
  ApiKeySummary,
  ExternalApiActor,
} from "@/types/externalApi";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildKeyMaterial() {
  const raw = randomBytes(24).toString("base64url");
  const keyPrefix = `frm_live_${raw.slice(0, 8)}`;
  const plainTextKey = `${keyPrefix}_${raw}`;
  return {
    plainTextKey,
    keyPrefix,
    lastFour: plainTextKey.slice(-4),
    tokenHash: hashToken(plainTextKey),
  };
}

function toApiKeySummary(row: {
  id: number;
  name: string;
  keyPrefix: string;
  lastFour: string;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}): ApiKeySummary {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.keyPrefix,
    lastFour: row.lastFour,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    revokedAt: row.revokedAt?.toISOString() ?? null,
  };
}

function toAdminApiKeySummary(row: {
  id: number;
  userId: number;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userRole: ExternalApiActor["role"] | "user";
  name: string;
  keyPrefix: string;
  lastFour: string;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}): AdminApiKeySummary {
  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.userEmail,
    userFirstName: row.userFirstName,
    userLastName: row.userLastName,
    userRole: row.userRole,
    name: row.name,
    keyPrefix: row.keyPrefix,
    lastFour: row.lastFour,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    revokedAt: row.revokedAt?.toISOString() ?? null,
  };
}

export async function listApiKeysForUser(userId: number): Promise<ApiKeySummary[]> {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const rows = await orm
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastFour: apiKeys.lastFour,
      createdAt: apiKeys.createdAt,
      expiresAt: apiKeys.expiresAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
    .orderBy(desc(apiKeys.createdAt));

  return rows.map((row) => toApiKeySummary(row));
}

export async function listApiKeysForAdmin(): Promise<AdminApiKeySummary[]> {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const rows = await orm
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userRole: users.role,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastFour: apiKeys.lastFour,
      createdAt: apiKeys.createdAt,
      expiresAt: apiKeys.expiresAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .innerJoin(users, eq(users.id, apiKeys.userId))
    .orderBy(desc(apiKeys.createdAt));

  return rows.map((row) => toAdminApiKeySummary(row));
}

export async function createApiKey(
  userId: number,
  name: string,
  expiresAt?: string | null
): Promise<ApiKeyCreateResult> {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("API key name required");
  }

  const normalizedExpiresAt = expiresAt ? new Date(expiresAt) : null;
  if (normalizedExpiresAt && Number.isNaN(normalizedExpiresAt.getTime())) {
    throw new Error("Invalid API key expiration");
  }

  const { plainTextKey, keyPrefix, lastFour, tokenHash } = buildKeyMaterial();
  const [createdApiKey] = await orm
    .insert(apiKeys)
    .values({
      userId,
      name: trimmedName,
      tokenHash,
      keyPrefix,
      lastFour,
      expiresAt: normalizedExpiresAt,
    })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastFour: apiKeys.lastFour,
      createdAt: apiKeys.createdAt,
      expiresAt: apiKeys.expiresAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
    });

  return {
    apiKey: toApiKeySummary(createdApiKey),
    plainTextKey,
  };
}

export async function revokeApiKey(userId: number, apiKeyId: number) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  await orm
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)));
}

export async function revokeApiKeyById(apiKeyId: number) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  await orm
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, apiKeyId), isNull(apiKeys.revokedAt)));
}

async function getBearerToken() {
  const headerStore = await headers();
  const authorization = headerStore.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

export async function requireExternalApiActor(): Promise<ExternalApiActor | null> {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const token = await getBearerToken();
  if (!token) return null;

  const tokenHash = hashToken(token);
  const [row] = await orm
    .select({
      apiKeyId: apiKeys.id,
      userId: apiKeys.userId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    })
    .from(apiKeys)
    .innerJoin(users, eq(users.id, apiKeys.userId))
    .where(
      and(
        isNull(apiKeys.revokedAt),
        or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, new Date())),
        eq(apiKeys.tokenHash, tokenHash),
        or(eq(users.role, "coach"), eq(users.role, "admin"))
      )
    )
    .limit(1);

  if (!row) {
    return null;
  }

  await orm.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.apiKeyId));

  return {
    id: row.userId,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    role: row.role === "admin" ? "admin" : "coach",
  };
}
