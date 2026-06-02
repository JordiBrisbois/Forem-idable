import { PoolClient } from "pg";
import { normalizeContractType } from "@/lib/contractType";
import { inferApplicationSourceType } from "@/lib/applications/sourceType";
import type { ApplicationSourceType } from "@/lib/applications/sourceType";
import { formatCoachAuthorName } from "@/lib/coachNotes";
import { db } from "@/lib/server/db";
import { JobApplication, CoachNoteAuthor, CoachPrivateNote, CoachSharedNote } from "@/types/application";
import { Job } from "@/types/job";

type Queryable = Pick<PoolClient, "query"> | NonNullable<typeof db>;

type ApplicationRow = {
  id: number;
  user_id: number;
  job_id: string;
  position: number;
  status: JobApplication["status"];
  applied_at: string;
  follow_up_due_at: string | null;
  follow_up_enabled: boolean;
  last_follow_up_at: string | null;
  interview_at: string | null;
  interview_details: string | null;
  beneficiary_notes: string | null;
  proofs: string | null;
  source_type: string;
  updated_at: string;
  title: string | null;
  company: string | null;
  location: string | null;
  contract_type: string | null;
  url: string | null;
  publication_date: string | null;
  provider: string | null;
  external_job_id: string | null;
  pdf_url: string | null;
  description: string | null;
  raw_payload: Job | null;
};

export interface RelationalApplicationRecord {
  applicationId: number;
  userId: number;
  jobId: string;
  position: number;
  application: JobApplication;
}

type PrivateNoteRow = {
  id: number;
  application_id: number;
  content: string;
  created_by_user_id: number | null;
  created_by_first_name: string;
  created_by_last_name: string;
  created_by_email: string;
  created_by_role: CoachNoteAuthor["role"];
  created_at: string;
  updated_at: string;
};

type SharedNoteRow = {
  id: string;
  application_id: number;
  content: string;
  created_by_user_id: number | null;
  created_by_first_name: string;
  created_by_last_name: string;
  created_by_email: string;
  created_by_role: CoachNoteAuthor["role"];
  created_at: string;
  updated_at: string;
};

type ContributorRow = {
  user_id: number | null;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string | null;
  role: CoachNoteAuthor["role"];
};

import { toNumericId, splitDisplayName, toIsoOrNow, toIsoOrNull } from "@/lib/server/common";

function normalizeJobSource(value: string | null | undefined): Job["source"] {
  if (value === "forem" || value === "linkedin" || value === "indeed" || value === "adzuna") {
    return value;
  }

  return "forem";
}

function toAuthorSnapshot(author: CoachNoteAuthor) {
  return {
    userId: author.role === "system" ? null : author.id,
    firstName: author.firstName,
    lastName: author.lastName,
    email: author.email,
    role: author.role,
    displayName: formatCoachAuthorName(author),
  };
}

function toContributorAuthor(row: ContributorRow): CoachNoteAuthor {
  const inferred = splitDisplayName(row.display_name);
  return {
    id: toNumericId(row.user_id) ?? 0,
    firstName: row.first_name || inferred.firstName,
    lastName: row.last_name || inferred.lastName,
    email: row.email ?? "",
    role: row.role,
  };
}

function buildAuthorFromNoteRow(row: PrivateNoteRow | SharedNoteRow): CoachNoteAuthor {
  return {
    id: toNumericId(row.created_by_user_id) ?? 0,
    firstName: row.created_by_first_name,
    lastName: row.created_by_last_name,
    email: row.created_by_email,
    role: row.created_by_role,
  };
}

function buildJob(row: ApplicationRow): Job {
  const rawPayload =
    row.raw_payload && typeof row.raw_payload === "object" && !Array.isArray(row.raw_payload)
      ? row.raw_payload
      : null;

  return {
    ...(rawPayload ?? {}),
    id: row.job_id,
    title: row.title ?? rawPayload?.title ?? "Sans intitulé",
    company: row.company ?? rawPayload?.company,
    location: row.location ?? rawPayload?.location ?? "Non precise",
    contractType: normalizeContractType(row.contract_type ?? rawPayload?.contractType),
    publicationDate: toIsoOrNow(row.publication_date ?? rawPayload?.publicationDate ?? null),
    url: row.url ?? rawPayload?.url ?? "#",
    source: normalizeJobSource(row.provider ?? rawPayload?.source),
    pdfUrl: row.pdf_url ?? rawPayload?.pdfUrl,
    description: row.description ?? rawPayload?.description,
  };
}

function buildApplicationAggregate(input: {
  row: ApplicationRow;
  privateNote: CoachPrivateNote | undefined;
  sharedNotes: CoachSharedNote[];
}): JobApplication {
  return {
    job: buildJob(input.row),
    appliedAt: toIsoOrNow(input.row.applied_at),
    followUpDueAt: toIsoOrNull(input.row.follow_up_due_at) ?? toIsoOrNow(input.row.applied_at),
    followUpEnabled: input.row.follow_up_enabled,
    lastFollowUpAt: toIsoOrNull(input.row.last_follow_up_at),
    status: input.row.status,
    sourceType: inferApplicationSourceType({
      sourceType:
        input.row.source_type === "manual" || input.row.source_type === "tracked"
          ? input.row.source_type
          : undefined,
      job: {
        id: input.row.job_id,
        url: input.row.url ?? "",
      },
    }),
    notes: input.row.beneficiary_notes,
    proofs: input.row.proofs,
    privateCoachNote: input.privateNote,
    sharedCoachNotes: input.sharedNotes,
    interviewAt: toIsoOrNull(input.row.interview_at),
    interviewDetails: input.row.interview_details,
    updatedAt: toIsoOrNow(input.row.updated_at),
  };
}

const applicationSelect = `SELECT applications.id,
        applications.user_id,
        applications.job_id,
        applications.position,
        applications.status,
        applications.applied_at,
        applications.follow_up_due_at,
        applications.follow_up_enabled,
        applications.last_follow_up_at,
        applications.interview_at,
        applications.interview_details,
        applications.beneficiary_notes,
        applications.proofs,
        applications.source_type,
        applications.updated_at,
        application_jobs.title,
        application_jobs.company,
        application_jobs.location,
        application_jobs.contract_type,
        application_jobs.url,
        application_jobs.publication_date,
        application_jobs.provider,
        application_jobs.external_job_id,
        application_jobs.pdf_url,
        application_jobs.description,
        application_jobs.raw_payload
 FROM applications
 LEFT JOIN application_jobs ON application_jobs.application_id = applications.id`;

type ApplicationNotesAggregate = {
  privateNotesByApplication: Map<number, CoachPrivateNote>;
  sharedNotesByApplication: Map<number, CoachSharedNote[]>;
};

async function loadApplicationRowsByClause(
  queryable: Queryable,
  clause: string,
  params: unknown[]
) {
  return queryable.query<ApplicationRow>(
    `${applicationSelect}
     ${clause}
     ORDER BY applications.user_id ASC, applications.position ASC, applications.created_at ASC`,
    params
  );
}

async function loadApplicationNotesAggregate(
  queryable: Queryable,
  applicationIds: number[]
): Promise<ApplicationNotesAggregate> {
  const [privateNotesResult, privateContributorsResult, sharedNotesResult, sharedContributorsResult] =
    await Promise.all([
      queryable.query<PrivateNoteRow>(
        `SELECT id,
                application_id,
                content,
                created_by_user_id,
                created_by_first_name,
                created_by_last_name,
                created_by_email,
                created_by_role,
                created_at,
                updated_at
         FROM application_private_notes
         WHERE application_id = ANY($1::bigint[])`,
        [applicationIds]
      ),
      queryable.query<ContributorRow & { private_note_id: number }>(
        `SELECT private_note_id,
                user_id,
                first_name,
                last_name,
                display_name,
                email,
                role
         FROM application_private_note_contributors
         WHERE private_note_id IN (
           SELECT id
           FROM application_private_notes
           WHERE application_id = ANY($1::bigint[])
         )`,
        [applicationIds]
      ),
      queryable.query<SharedNoteRow>(
        `SELECT id,
                application_id,
                content,
                created_by_user_id,
                created_by_first_name,
                created_by_last_name,
                created_by_email,
                created_by_role,
                created_at,
                updated_at
         FROM application_shared_notes
         WHERE application_id = ANY($1::bigint[])
         ORDER BY created_at ASC, id ASC`,
        [applicationIds]
      ),
      queryable.query<ContributorRow & { shared_note_id: string }>(
        `SELECT shared_note_id,
                user_id,
                first_name,
                last_name,
                display_name,
                email,
                role
         FROM application_shared_note_contributors
         WHERE shared_note_id IN (
           SELECT id
           FROM application_shared_notes
           WHERE application_id = ANY($1::bigint[])
         )`,
        [applicationIds]
      ),
    ]);

  const privateContributorsByNote = new Map<number, CoachNoteAuthor[]>();
  for (const row of privateContributorsResult.rows) {
    privateContributorsByNote.set(row.private_note_id, [
      ...(privateContributorsByNote.get(row.private_note_id) ?? []),
      toContributorAuthor(row),
    ]);
  }

  const privateNotesByApplication = new Map<number, CoachPrivateNote>();
  for (const row of privateNotesResult.rows) {
    privateNotesByApplication.set(row.application_id, {
      content: row.content,
      createdAt: toIsoOrNow(row.created_at),
      updatedAt: toIsoOrNow(row.updated_at),
      createdBy: buildAuthorFromNoteRow(row),
      contributors: privateContributorsByNote.get(row.id) ?? [buildAuthorFromNoteRow(row)],
    });
  }

  const sharedContributorsByNote = new Map<string, CoachNoteAuthor[]>();
  for (const row of sharedContributorsResult.rows) {
    sharedContributorsByNote.set(row.shared_note_id, [
      ...(sharedContributorsByNote.get(row.shared_note_id) ?? []),
      toContributorAuthor(row),
    ]);
  }

  const sharedNotesByApplication = new Map<number, CoachSharedNote[]>();
  for (const row of sharedNotesResult.rows) {
    sharedNotesByApplication.set(row.application_id, [
      ...(sharedNotesByApplication.get(row.application_id) ?? []),
      {
        id: row.id,
        content: row.content,
        createdAt: toIsoOrNow(row.created_at),
        updatedAt: toIsoOrNow(row.updated_at),
        createdBy: buildAuthorFromNoteRow(row),
        contributors: sharedContributorsByNote.get(row.id) ?? [buildAuthorFromNoteRow(row)],
      },
    ]);
  }

  return {
    privateNotesByApplication,
    sharedNotesByApplication,
  };
}

function buildRelationalApplicationRecord(
  row: ApplicationRow,
  notesAggregate: ApplicationNotesAggregate
): RelationalApplicationRecord {
  return {
    applicationId: toNumericId(row.id) ?? 0,
    userId: toNumericId(row.user_id) ?? 0,
    jobId: row.job_id,
    position: row.position,
    application: buildApplicationAggregate({
      row,
      privateNote: notesAggregate.privateNotesByApplication.get(row.id),
      sharedNotes: notesAggregate.sharedNotesByApplication.get(row.id) ?? [],
    }),
  };
}

async function loadApplicationsByClause(
  queryable: Queryable,
  clause: string,
  params: unknown[]
) {
  const applicationsResult = await loadApplicationRowsByClause(queryable, clause, params);

  if (applicationsResult.rows.length === 0) {
    return new Map<number, JobApplication[]>();
  }

  const notesAggregate = await loadApplicationNotesAggregate(
    queryable,
    applicationsResult.rows.map((row) => row.id)
  );

  const applicationsByUser = new Map<number, JobApplication[]>();
  for (const row of applicationsResult.rows) {
    const record = buildRelationalApplicationRecord(row, notesAggregate);
    const userId = record.userId;
    applicationsByUser.set(userId, [
      ...(applicationsByUser.get(userId) ?? []),
      record.application,
    ]);
  }

  return applicationsByUser;
}

async function loadApplicationRecordsByClause(
  queryable: Queryable,
  clause: string,
  params: unknown[]
): Promise<RelationalApplicationRecord[]> {
  const applicationsResult = await loadApplicationRowsByClause(queryable, clause, params);

  if (applicationsResult.rows.length === 0) {
    return [];
  }

  const notesAggregate = await loadApplicationNotesAggregate(
    queryable,
    applicationsResult.rows.map((row) => row.id)
  );

  return applicationsResult.rows.map((row) =>
    buildRelationalApplicationRecord(row, notesAggregate)
  );
}

export async function listApplicationsFromRelationalStore(userId: number) {  return (await loadApplicationsByClause(db, "WHERE applications.user_id = $1", [userId])).get(userId) ?? [];
}

export async function listApplicationsFromRelationalStoreByUsers(userIds: number[]) {  if (userIds.length === 0) return new Map<number, JobApplication[]>();
  return loadApplicationsByClause(db, "WHERE applications.user_id = ANY($1::bigint[])", [userIds]);
}

export async function loadApplicationFromRelationalStore(userId: number, jobId: string) {  const record = await getRelationalApplicationRecordByUserAndJob(userId, jobId);
  return record?.application ?? null;
}

export async function listApplicationRecordsFromRelationalStoreByUsers(userIds: number[]) {  if (userIds.length === 0) return [];
  return loadApplicationRecordsByClause(db, "WHERE applications.user_id = ANY($1::bigint[])", [userIds]);
}

export async function getRelationalApplicationRecordById(applicationId: number) {  const records = await loadApplicationRecordsByClause(
    db,
    "WHERE applications.id = $1",
    [applicationId]
  );

  return records[0] ?? null;
}

export async function getRelationalApplicationRecordByUserAndJob(userId: number, jobId: string) {  const records = await loadApplicationRecordsByClause(
    db,
    "WHERE applications.user_id = $1 AND applications.job_id = $2",
    [userId, jobId]
  );

  return records[0] ?? null;
}

async function upsertApplicationShell(
  queryable: Queryable,
  input: {
    userId: number;
    position: number;
    application: JobApplication;
    sourceType: ApplicationSourceType;
  }
) {
  const result = await queryable.query<{ id: number }>(
    `INSERT INTO applications (
       user_id,
       job_id,
       position,
       status,
       applied_at,
       follow_up_due_at,
       follow_up_enabled,
       last_follow_up_at,
       interview_at,
       interview_details,
       beneficiary_notes,
       proofs,
       source_type,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     ON CONFLICT (user_id, job_id)
     DO UPDATE SET
       position = EXCLUDED.position,
       status = EXCLUDED.status,
       applied_at = EXCLUDED.applied_at,
       follow_up_due_at = EXCLUDED.follow_up_due_at,
       follow_up_enabled = EXCLUDED.follow_up_enabled,
       last_follow_up_at = EXCLUDED.last_follow_up_at,
       interview_at = EXCLUDED.interview_at,
       interview_details = EXCLUDED.interview_details,
       beneficiary_notes = EXCLUDED.beneficiary_notes,
       proofs = EXCLUDED.proofs,
       source_type = EXCLUDED.source_type,
       updated_at = EXCLUDED.updated_at
     RETURNING id`,
    [
      input.userId,
      input.application.job.id,
      input.position,
      input.application.status,
      toIsoOrNow(input.application.appliedAt),
      input.application.followUpDueAt ? toIsoOrNow(input.application.followUpDueAt) : null,
      input.application.followUpEnabled !== false,
      input.application.lastFollowUpAt,
      input.application.interviewAt,
      input.application.interviewDetails?.trim() || null,
      input.application.notes?.trim() || null,
      input.application.proofs?.trim() || null,
      input.sourceType,
      toIsoOrNow(input.application.updatedAt),
    ]
  );

  return result.rows[0].id;
}

async function upsertApplicationJob(
  queryable: Queryable,
  applicationId: number,
  job: Job
) {
  await queryable.query(
    `INSERT INTO application_jobs (
       application_id,
       provider,
       external_job_id,
       title,
       company,
       location,
       contract_type,
       url,
       publication_date,
       pdf_url,
       description,
       raw_payload
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
     ON CONFLICT (application_id)
     DO UPDATE SET
       provider = EXCLUDED.provider,
       external_job_id = EXCLUDED.external_job_id,
       title = EXCLUDED.title,
       company = EXCLUDED.company,
       location = EXCLUDED.location,
       contract_type = EXCLUDED.contract_type,
       url = EXCLUDED.url,
       publication_date = EXCLUDED.publication_date,
       pdf_url = EXCLUDED.pdf_url,
       description = EXCLUDED.description,
       raw_payload = EXCLUDED.raw_payload`,
    [
      applicationId,
      job.source,
      job.id,
      job.title,
      job.company?.trim() || null,
      job.location,
      job.contractType,
      job.url,
      job.publicationDate ? toIsoOrNow(job.publicationDate) : null,
      job.pdfUrl ?? null,
      job.description?.trim() || null,
      JSON.stringify(job),
    ]
  );
}

async function replacePrivateNote(
  queryable: Queryable,
  applicationId: number,
  privateNote: CoachPrivateNote | undefined
) {
  const existingResult = await queryable.query<{ id: number }>(
    `SELECT id
     FROM application_private_notes
     WHERE application_id = $1
     LIMIT 1`,
    [applicationId]
  );
  const existingNoteId = existingResult.rows[0]?.id ?? null;

  if (!privateNote || !privateNote.content.trim()) {
    if (existingNoteId) {
      await queryable.query(`DELETE FROM application_private_notes WHERE id = $1`, [existingNoteId]);
    }
    return;
  }

  const creator = toAuthorSnapshot(privateNote.createdBy);
  const noteResult = await queryable.query<{ id: number }>(
    `INSERT INTO application_private_notes (
       application_id,
       content,
       created_by_user_id,
       created_by_first_name,
       created_by_last_name,
       created_by_email,
       created_by_role,
       created_at,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (application_id)
     DO UPDATE SET
       content = EXCLUDED.content,
       created_by_user_id = EXCLUDED.created_by_user_id,
       created_by_first_name = EXCLUDED.created_by_first_name,
       created_by_last_name = EXCLUDED.created_by_last_name,
       created_by_email = EXCLUDED.created_by_email,
       created_by_role = EXCLUDED.created_by_role,
       created_at = EXCLUDED.created_at,
       updated_at = EXCLUDED.updated_at
     RETURNING id`,
    [
      applicationId,
      privateNote.content.trim(),
      creator.userId,
      creator.firstName,
      creator.lastName,
      creator.email,
      creator.role,
      toIsoOrNow(privateNote.createdAt),
      toIsoOrNow(privateNote.updatedAt),
    ]
  );

  const noteId = noteResult.rows[0].id;
  await queryable.query(
    `DELETE FROM application_private_note_contributors
     WHERE private_note_id = $1`,
    [noteId]
  );

  for (const contributor of privateNote.contributors) {
    const snapshot = toAuthorSnapshot(contributor);
    await queryable.query(
      `INSERT INTO application_private_note_contributors (
         private_note_id,
         user_id,
         first_name,
         last_name,
         display_name,
         email,
         role
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        noteId,
        snapshot.userId,
        snapshot.firstName,
        snapshot.lastName,
        snapshot.displayName,
        snapshot.email || null,
        snapshot.role,
      ]
    );
  }
}

async function replaceSharedNotes(
  queryable: Queryable,
  applicationId: number,
  sharedNotes: CoachSharedNote[] | undefined
) {
  await queryable.query(`DELETE FROM application_shared_notes WHERE application_id = $1`, [applicationId]);

  for (const note of sharedNotes ?? []) {
    if (!note.content.trim()) {
      continue;
    }

    const sharedNoteId = note.id;
    const creator = toAuthorSnapshot(note.createdBy);
    await queryable.query(
      `INSERT INTO application_shared_notes (
         id,
         application_id,
         content,
         created_by_user_id,
         created_by_first_name,
         created_by_last_name,
         created_by_email,
         created_by_role,
         created_at,
         updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        sharedNoteId,
        applicationId,
        note.content.trim(),
        creator.userId,
        creator.firstName,
        creator.lastName,
        creator.email,
        creator.role,
        toIsoOrNow(note.createdAt),
        toIsoOrNow(note.updatedAt),
      ]
    );

    for (const contributor of note.contributors) {
      const snapshot = toAuthorSnapshot(contributor);
      await queryable.query(
        `INSERT INTO application_shared_note_contributors (
           shared_note_id,
           user_id,
           first_name,
           last_name,
           display_name,
           email,
           role
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          sharedNoteId,
          snapshot.userId,
          snapshot.firstName,
          snapshot.lastName,
          snapshot.displayName,
          snapshot.email || null,
          snapshot.role,
        ]
      );
    }
  }
}

export async function saveApplicationToRelationalStore(
  queryable: Queryable,
  input: {
    userId: number;
    position: number;
    application: JobApplication;
    sourceType?: ApplicationSourceType;
  }
) {
  const applicationId = await upsertApplicationShell(queryable, {
    userId: input.userId,
    position: input.position,
    application: input.application,
    sourceType: input.sourceType ?? "tracked",
  });

  await upsertApplicationJob(queryable, applicationId, input.application.job);
  await replacePrivateNote(queryable, applicationId, input.application.privateCoachNote);
  await replaceSharedNotes(queryable, applicationId, input.application.sharedCoachNotes);
}

export async function replaceApplicationsInRelationalStore(
  queryable: Queryable,
  userId: number,
  applications: JobApplication[]
) {
  await queryable.query(`DELETE FROM applications WHERE user_id = $1`, [userId]);

  for (const [position, application] of applications.entries()) {
    await saveApplicationToRelationalStore(queryable, {
      userId,
      position,
      application,
      sourceType: inferApplicationSourceType(application),
    });
  }
}

export async function deleteApplicationFromRelationalStore(
  queryable: Queryable,
  userId: number,
  jobId: string
) {
  await queryable.query(
    `DELETE FROM applications
     WHERE user_id = $1 AND job_id = $2`,
    [userId, jobId]
  );
}
