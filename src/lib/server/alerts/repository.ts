import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { ensureDatabase, orm } from "@/lib/server/db";
import { jobAlerts } from "@/lib/server/schema";
import type { ContractType } from "@/lib/contractType";
import type { LocationFilter } from "@/lib/server/offers/filters";

async function database() {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");
  return orm;
}

export interface JobAlertInput {
  name: string;
  keywords: string[];
  locations: LocationFilter[];
  booleanMode: "AND" | "OR";
  goal: "job" | "internship";
  contractTypes: ContractType[];
  regimes: string[];
  sectors: string[];
  languages: string[];
}

export interface JobAlertRecord extends JobAlertInput {
  id: number;
  frequency: "daily";
  isActive: boolean;
  createdAt: Date;
  lastSentAt: Date | null;
  unsubscribeToken: string;
}

function toRecord(row: typeof jobAlerts.$inferSelect): JobAlertRecord {
  return {
    id: Number(row.id),
    name: row.name,
    keywords: row.keywords,
    locations: Array.isArray(row.locations) ? (row.locations as LocationFilter[]) : [],
    booleanMode: row.booleanMode === "AND" ? "AND" : "OR",
    goal: row.goal === "internship" ? "internship" : "job",
    contractTypes: row.contractTypes as ContractType[],
    regimes: row.regimes,
    sectors: row.sectors,
    languages: row.languages,
    frequency: "daily",
    isActive: row.isActive,
    createdAt: row.createdAt,
    lastSentAt: row.lastSentAt,
    unsubscribeToken: row.unsubscribeToken,
  };
}

/** Creates an alert for a user. The consent timestamp is recorded implicitly. */
export async function createJobAlert(
  userId: number,
  input: JobAlertInput
): Promise<JobAlertRecord> {
  const db = await database();
  const [row] = await db
    .insert(jobAlerts)
    .values({
      userId,
      name: input.name,
      keywords: input.keywords,
      locations: input.locations,
      booleanMode: input.booleanMode,
      goal: input.goal,
      contractTypes: input.contractTypes,
      regimes: input.regimes,
      sectors: input.sectors,
      languages: input.languages,
      unsubscribeToken: randomBytes(32).toString("hex"),
    })
    .returning();

  return toRecord(row);
}

export async function listJobAlerts(userId: number): Promise<JobAlertRecord[]> {
  const db = await database();
  const rows = await db
    .select()
    .from(jobAlerts)
    .where(eq(jobAlerts.userId, userId))
    .orderBy(desc(jobAlerts.createdAt));

  return rows.map(toRecord);
}

/** Deletes one alert, scoped to its owner so an id alone is not enough. */
export async function deleteJobAlert(userId: number, alertId: number): Promise<boolean> {
  const db = await database();
  const deleted = await db
    .delete(jobAlerts)
    .where(and(eq(jobAlerts.id, alertId), eq(jobAlerts.userId, userId)))
    .returning({ id: jobAlerts.id });

  return deleted.length > 0;
}

/** One-click unsubscribe from the email link: deactivates without a session. */
export async function unsubscribeJobAlert(token: string): Promise<boolean> {
  const db = await database();
  const updated = await db
    .update(jobAlerts)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(jobAlerts.unsubscribeToken, token))
    .returning({ id: jobAlerts.id });

  return updated.length > 0;
}

export interface DueAlert extends JobAlertRecord {
  userId: number;
  email: string;
  firstName: string;
}

/**
 * Active daily alerts whose last send is older than 20 hours (a daily digest,
 * tolerant to a late run) joined with the recipient's address.
 */
export async function listDueAlerts(now: Date): Promise<DueAlert[]> {
  const db = await database();
  const cutoff = new Date(now.getTime() - 20 * 60 * 60 * 1000);

  const rows = await db.execute<{
    id: string;
    user_id: string;
    name: string;
    keywords: string[];
    locations: unknown;
    boolean_mode: string;
    goal: string;
    contract_types: string[];
    regimes: string[];
    sectors: string[];
    languages: string[];
    last_sent_at: Date | null;
    created_at: Date;
    unsubscribe_token: string;
    email: string;
    first_name: string;
  }>(sql`
    SELECT a.id, a.user_id, a.name, a.keywords, a.locations, a.boolean_mode, a.goal,
           a.contract_types, a.regimes, a.sectors, a.languages, a.last_sent_at,
           a.created_at, a.unsubscribe_token, u.email, u.first_name
    FROM ${jobAlerts} a
    INNER JOIN users u ON u.id = a.user_id
    WHERE a.is_active = true
      AND a.frequency = 'daily'
      AND (a.last_sent_at IS NULL OR a.last_sent_at < ${cutoff})
    ORDER BY a.id
    LIMIT 50
  `);

  return rows.rows.map((row) => ({
    id: Number(row.id),
    userId: Number(row.user_id),
    name: row.name,
    keywords: row.keywords,
    locations: Array.isArray(row.locations) ? (row.locations as LocationFilter[]) : [],
    booleanMode: row.boolean_mode === "AND" ? "AND" : "OR",
    goal: row.goal === "internship" ? "internship" : "job",
    contractTypes: row.contract_types as ContractType[],
    regimes: row.regimes,
    sectors: row.sectors,
    languages: row.languages,
    frequency: "daily",
    isActive: true,
    createdAt: row.created_at,
    lastSentAt: row.last_sent_at,
    unsubscribeToken: row.unsubscribe_token,
    email: row.email,
    firstName: row.first_name,
  }));
}

export async function markJobAlertSent(alertId: number, at: Date): Promise<void> {
  const db = await database();
  await db
    .update(jobAlerts)
    .set({ lastSentAt: at, updatedAt: at })
    .where(eq(jobAlerts.id, alertId));
}

/** Removes every alert of a user (GDPR: deleting the alert deletes the data). */
export async function deleteAllJobAlerts(userId: number): Promise<number> {
  const db = await database();
  const deleted = await db
    .delete(jobAlerts)
    .where(eq(jobAlerts.userId, userId))
    .returning({ id: jobAlerts.id });

  return deleted.length;
}

/** Turns emailing on or off for one alert, scoped to its owner. */
export async function setJobAlertActive(
  userId: number,
  alertId: number,
  isActive: boolean
): Promise<boolean> {
  const db = await database();
  const updated = await db
    .update(jobAlerts)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(jobAlerts.id, alertId), eq(jobAlerts.userId, userId)))
    .returning({ id: jobAlerts.id });

  return updated.length > 0;
}

/** Marks several alerts as sent in one statement (grouped digest). */
export async function markJobAlertsSent(alertIds: number[], at: Date): Promise<void> {
  if (alertIds.length === 0) return;

  const db = await database();
  await db
    .update(jobAlerts)
    .set({ lastSentAt: at, updatedAt: at })
    .where(inArray(jobAlerts.id, alertIds));
}
