import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { db, ensureDatabase } from "@/lib/server/db";

const encoder = new TextEncoder();

function sendEvent(controller: ReadableStreamDefaultController, event: unknown) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { jobId: rawJobId } = await context.params;
  const jobId = Number(rawJobId);
  if (!jobId) {
    return new Response("Invalid job ID", { status: 400 });
  }

  await ensureDatabase();
  const check = await db.query<{ user_id: number }>(
    `SELECT user_id FROM scout_jobs WHERE id = $1`,
    [jobId]
  );
  if (check.rows.length === 0) {
    return new Response("Job not found", { status: 404 });
  }
  if (Number(check.rows[0].user_id) !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let lastCompletedSteps = -1;
      let lastResultCount = -1;

      try {
        const poll = async () => {
          const result = await db.query<{
            status: string;
            total_steps: number;
            completed_steps: number;
            result_count: number;
            error_message: string | null;
          }>(
            `SELECT status, total_steps, completed_steps, result_count, error_message
             FROM scout_jobs WHERE id = $1`,
            [jobId]
          );

          if (result.rows.length === 0) {
            sendEvent(controller, { type: "error", message: "Job introuvable." });
            controller.close();
            return false;
          }

          const job = result.rows[0];

          if (job.status === "queued") {
            sendEvent(controller, {
              type: "progress",
              step: 0,
              total: job.total_steps || 1,
              found: job.result_count ?? 0,
              message: "En attente dans la file...",
            });
            return true;
          }

          if (job.status === "running") {
            if (
              job.completed_steps !== lastCompletedSteps ||
              job.result_count !== lastResultCount
            ) {
              lastCompletedSteps = job.completed_steps;
              lastResultCount = job.result_count;
              sendEvent(controller, {
                type: "progress",
                step: job.completed_steps,
                total: job.total_steps || 1,
                found: job.result_count ?? 0,
                message: `Recherche en cours...`,
              });
            }
            return true;
          }

          if (job.status === "completed") {
            sendEvent(controller, {
              type: "completed",
              resultCount: job.result_count ?? 0,
            });
            controller.close();
            return false;
          }

          if (job.status === "failed") {
            sendEvent(controller, {
              type: "error",
              message: job.error_message || "Échec de la recherche.",
            });
            controller.close();
            return false;
          }

          return true;
        };

        // Initial poll
        let shouldContinue = await poll();
        if (!shouldContinue) return;

        while (shouldContinue) {
          await sleep(1500);
          if (request.signal.aborted) {
            controller.close();
            return;
          }
          shouldContinue = await poll();
        }
      } catch {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
