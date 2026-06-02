import { sql } from "drizzle-orm";
import { ensureDatabase, orm } from "@/lib/server/db";

export type LegalHoldTargetLookupType = "conversation" | "application";

export type LegalHoldTargetLookupOption = {
  id: number;
  label: string;
  description: string | null;
};

function normalizeSearchTerm(query: string | undefined) {
  const trimmed = query?.trim() ?? "";
  return trimmed.length > 0 ? `%${trimmed}%` : null;
}

export async function listLegalHoldTargetOptions(input: {
  targetType: LegalHoldTargetLookupType;
  q?: string;
  limit?: number;
}): Promise<LegalHoldTargetLookupOption[]> {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const likeTerm = normalizeSearchTerm(input.q);
  const limit = input.limit ?? 12;
  const mapRows = (rows: Record<string, unknown>[]) =>
    rows.map((row) => ({
      id: Number(row.id),
      label: typeof row.label === "string" ? row.label : `Cible #${String(row.id ?? "")}`,
      description: typeof row.description === "string" ? row.description : null,
    }));

  if (input.targetType === "application") {
    const searchFilter = likeTerm
      ? sql`
          AND (
            aj.title ILIKE ${likeTerm}
            OR COALESCE(aj.company, '') ILIKE ${likeTerm}
            OR COALESCE(aj.location, '') ILIKE ${likeTerm}
            OR u.email ILIKE ${likeTerm}
            OR CONCAT_WS(' ', u.first_name, u.last_name) ILIKE ${likeTerm}
          )
        `
      : sql``;

    const result = await orm.execute(sql<LegalHoldTargetLookupOption>`
      SELECT a.id AS id,
             COALESCE(NULLIF(aj.title, ''), CONCAT('Candidature #', a.id::text)) AS label,
             CONCAT_WS(
               ' · ',
               COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.email),
               COALESCE(NULLIF(aj.company, ''), 'Entreprise non précisée'),
               CASE a.status
                 WHEN 'in_progress' THEN 'En cours'
                 WHEN 'follow_up' THEN 'Relance'
                 WHEN 'interview' THEN 'Entretien'
                 WHEN 'accepted' THEN 'Acceptée'
                 WHEN 'rejected' THEN 'Refusée'
                 ELSE a.status
               END
             ) AS description
      FROM applications a
      INNER JOIN users u ON u.id = a.user_id
      LEFT JOIN application_jobs aj ON aj.application_id = a.id
      WHERE a.archived_at IS NULL
      ${searchFilter}
      ORDER BY a.updated_at DESC, a.id DESC
      LIMIT ${limit}
    `);

    return mapRows(result.rows);
  }

  const conversationSearchFilter = likeTerm
    ? sql`
        AND (
          COALESCE(cg.name, '') ILIKE ${likeTerm}
          OR COALESCE(u.email, '') ILIKE ${likeTerm}
          OR CONCAT_WS(' ', u.first_name, u.last_name) ILIKE ${likeTerm}
        )
      `
    : sql``;

  const result = await orm.execute(sql<LegalHoldTargetLookupOption>`
    SELECT c.id AS id,
           CASE
             WHEN c.type = 'group' THEN COALESCE(NULLIF(cg.name, ''), CONCAT('Conversation groupe #', c.id::text))
             ELSE COALESCE(
               NULLIF(
                 STRING_AGG(
                   DISTINCT COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.email),
                   ' · '
                 ),
                 ''
               ),
               CONCAT('Conversation directe #', c.id::text)
             )
           END AS label,
           CASE
             WHEN c.type = 'group' THEN CONCAT('Groupe · ', COUNT(DISTINCT cp.user_id)::text, ' participant(s)')
             ELSE CONCAT_WS(
               ' · ',
               'DM',
               NULLIF(STRING_AGG(DISTINCT u.email, ' · '), '')
             )
           END AS description
    FROM conversations c
    LEFT JOIN coach_groups cg ON cg.id = c.group_id
    LEFT JOIN conversation_participants cp
      ON cp.conversation_id = c.id
     AND cp.left_at IS NULL
    LEFT JOIN users u ON u.id = cp.user_id
    WHERE 1 = 1
    ${conversationSearchFilter}
    GROUP BY c.id, c.type, cg.name, c.last_message_at
    ORDER BY c.last_message_at DESC, c.id DESC
    LIMIT ${limit}
  `);

  return mapRows(result.rows);
}
