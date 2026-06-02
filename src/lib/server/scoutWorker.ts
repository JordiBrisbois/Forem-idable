import { db } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/observability";
import {
  buildOverpassQuery,
  parseOverpassElements,
  queryOverpass,
} from "@/lib/server/scoutOverpass";
import { scrapeEmails } from "@/lib/server/scoutScraper";
import {
  cacheScoutResult,
  getCachedCompany,
} from "@/lib/server/companyCache";

let workerStarted = false;

function safeJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

async function jobStillExists(jobId: number): Promise<boolean> {
  const result = await db.query<{ id: number }>(
    `SELECT id FROM scout_jobs WHERE id = $1`,
    [jobId]
  );
  return result.rows.length > 0;
}

async function processNextJob(): Promise<void> {
  const jobResult = await db.query<{
    id: number;
    user_id: number;
    lat: string;
    lon: string;
    radius: number;
    categories: string;
    scrape_emails: boolean;
  }>(
    `SELECT id, user_id, lat, lon, radius, categories, scrape_emails
     FROM scout_jobs
     WHERE status = 'queued'
     ORDER BY created_at ASC
     LIMIT 1
     FOR UPDATE SKIP LOCKED`
  );

  if (jobResult.rows.length === 0) return;

  const job = jobResult.rows[0];
  const jobId = job.id;

  try {
    // Mark as running
    await db.query(`UPDATE scout_jobs SET status = 'running' WHERE id = $1`, [jobId]);

    const categories: string[] = safeJson(job.categories) as string[];
    const batchSize = 3;
    const batches: string[][] = [];
    for (let i = 0; i < categories.length; i += batchSize) {
      batches.push(categories.slice(i, i + batchSize));
    }

    const totalSteps = batches.length;
    await db.query(`UPDATE scout_jobs SET total_steps = $1 WHERE id = $2`, [totalSteps, jobId]);

    let insertedCount = 0;
    const seenOsmIds = new Set<number>();

    for (let i = 0; i < batches.length; i++) {
      const overpassQuery = buildOverpassQuery(
        batches[i],
        job.radius,
        Number(job.lat),
        Number(job.lon)
      );

      const elements = await queryOverpass(overpassQuery);
      const parsed = parseOverpassElements(elements);

        for (const item of parsed) {
        if (item.osmId && seenOsmIds.has(item.osmId)) continue;
        if (item.osmId) seenOsmIds.add(item.osmId);

        // If user deleted the job mid-processing, bail out gracefully
        if (!(await jobStillExists(jobId))) {
          return;
        }

        let cached = null;
        if (item.osmId) {
          cached = await getCachedCompany(item.osmId);
        }

        const email = cached?.email ?? (item.email || null);
        const emailSource = cached?.emailSource ?? (item.email ? "osm" : "");
        const allEmails = cached?.allEmails ?? [];

        await db.query(
          `INSERT INTO scout_results (job_id, name, type, email, website, phone, address, lat, lon, town, email_source, all_emails, osm_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13)
           ON CONFLICT DO NOTHING`,
          [
            jobId,
            item.name,
            item.type,
            email,
            item.website || null,
            item.phone || null,
            item.address || null,
            item.lat !== null ? String(item.lat) : null,
            item.lon !== null ? String(item.lon) : null,
            item.town || null,
            emailSource,
            JSON.stringify(allEmails),
            item.osmId || null,
          ]
        );
        insertedCount++;

        if (item.osmId) {
          await cacheScoutResult({
            osmId: item.osmId,
            name: item.name,
            type: item.type,
            email,
            website: item.website || null,
            phone: item.phone || null,
            address: item.address || null,
            lat: item.lat !== null ? String(item.lat) : null,
            lon: item.lon !== null ? String(item.lon) : null,
            town: item.town || null,
            emailSource,
            allEmails,
          });
        }
      }

      if (await jobStillExists(jobId)) {
        await db.query(
          `UPDATE scout_jobs SET completed_steps = $1, result_count = $2 WHERE id = $3`,
          [i + 1, insertedCount, jobId]
        );
      }

      if (i < batches.length - 1) {
        await sleep(3000);
      }
    }

    // Bail if job was deleted before scraping
    if (!(await jobStillExists(jobId))) return;

    // Scraping
    if (job.scrape_emails) {
      const toScrape = await db.query<{
        id: number;
        website: string;
        osm_id: number | null;
      }>(
        `SELECT id, website, osm_id FROM scout_results WHERE job_id = $1 AND (email IS NULL OR email = '') AND website IS NOT NULL AND website != ''`,
        [jobId]
      );

      const totalScrapeSteps = totalSteps + toScrape.rows.length;
      await db.query(`UPDATE scout_jobs SET total_steps = $1 WHERE id = $2`, [totalScrapeSteps, jobId]);

      for (let i = 0; i < toScrape.rows.length; i++) {
        const { id: resultId, website, osm_id: resultOsmId } = toScrape.rows[i];

        let emails: string[] = [];

        if (resultOsmId) {
          const cached = await getCachedCompany(resultOsmId);
          if (cached?.email) {
            emails = cached.allEmails;
          }
        }

        if (emails.length === 0 && website) {
          emails = await scrapeEmails(website);
          if (resultOsmId && emails.length > 0) {
            await cacheScoutResult(
              {
                osmId: resultOsmId,
                name: "",
                type: "?",
                email: emails[0],
                website,
                phone: null,
                address: null,
                lat: null,
                lon: null,
                town: null,
                emailSource: "scrape",
                allEmails: emails,
              },
              new Date()
            );
          }
        }

        if (emails.length > 0) {
          await db.query(
            `UPDATE scout_results SET email = $1, email_source = 'scrape', all_emails = $2::jsonb WHERE id = $3`,
            [emails[0], JSON.stringify(emails), resultId]
          );
        }

        if (await jobStillExists(jobId)) {
          await db.query(
            `UPDATE scout_jobs SET completed_steps = $1 WHERE id = $2`,
            [totalSteps + i + 1, jobId]
          );
        }

        if (i < toScrape.rows.length - 1 && emails.length === 0) {
          await sleep(2000);
        } else if (i < toScrape.rows.length - 1) {
          await sleep(400);
        }
      }
    }

    if (await jobStillExists(jobId)) {
      await db.query(
        `UPDATE scout_jobs SET status = 'completed', result_count = $1, completed_at = NOW() WHERE id = $2`,
        [insertedCount, jobId]
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    if (await jobStillExists(jobId)) {
      await db.query(
        `UPDATE scout_jobs SET status = 'failed', error_message = $1 WHERE id = $2`,
        [message, jobId]
      );
    }
    logServerEvent({
      category: "scout",
      action: "worker_job_failed",
      level: "error",
      meta: { jobId, error: message },
    });
  }
}

export async function startScoutWorker(): Promise<void> {
  if (workerStarted) return;
  workerStarted = true;

  // Recover jobs that were left 'running' after a crash/restart
  try {
    const recovered = await db.query<{ count: string }>(
      `UPDATE scout_jobs SET status = 'queued' WHERE status = 'running' RETURNING COUNT(*)::text AS count`
    );
    const count = Number(recovered.rows[0]?.count ?? 0);
    if (count > 0) {
      logServerEvent({
        category: "scout",
        action: "worker_recovered_jobs",
        level: "info",
        meta: { recoveredCount: count },
      });
    }
  } catch {
    // ignore recovery errors
  }

  logServerEvent({
    category: "scout",
    action: "worker_started",
    level: "info",
    meta: { pollIntervalMs: 10000 },
  });

  // Loop instead of setInterval so jobs are strictly sequential:
  // the next job is only picked after the previous one fully completes.
  while (true) {
    await processNextJob();
    await sleep(10000);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
