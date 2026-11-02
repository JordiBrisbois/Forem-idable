// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import {
  deleteApplicationFromRelationalStore,
  listApplicationsFromRelationalStore,
  loadApplicationFromRelationalStore,
  saveApplicationToRelationalStore,
} from "@/lib/server/applicationStore";
import type { JobApplication } from "@/types/application";
import type { Job } from "@/types/job";
import { createUser, describeWithDatabase, resetDatabase } from "../../../tests/integration/fixtures";

/**
 * The unit suite mocks `db`, so it proves the mapping but never that the SQL
 * itself is valid against the real schema — upserts, the unique (user_id,
 * job_id) index, cascade deletes and ordering are only exercised here.
 */
describeWithDatabase("applicationStore (integration)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("persists an application and reads the job metadata back", async () => {
    const user = await createUser();
    const application = buildApplication();

    await saveApplicationToRelationalStore(db, {
      userId: user.id,
      position: 0,
      application,
    });

    const loaded = await listApplicationsFromRelationalStore(user.id);

    expect(loaded).toHaveLength(1);
    expect(loaded[0].job.id).toBe("job-1");
    expect(loaded[0].job.title).toBe("Développeur full-stack");
    expect(loaded[0].job.company).toBe("Forem");
    expect(loaded[0].status).toBe("in_progress");
    expect(loaded[0].appliedAt).toBe(application.appliedAt);
  });

  it("updates in place instead of duplicating on the same user and job id", async () => {
    const user = await createUser();

    await saveApplicationToRelationalStore(db, {
      userId: user.id,
      position: 0,
      application: buildApplication(),
    });

    await saveApplicationToRelationalStore(db, {
      userId: user.id,
      position: 0,
      application: buildApplication({
        status: "accepted",
        jobOverrides: { title: "Développeur full-stack (senior)" },
      }),
    });

    const loaded = await listApplicationsFromRelationalStore(user.id);

    // The unique index on (user_id, job_id) must have turned the second write
    // into an update, not a second row.
    expect(loaded).toHaveLength(1);
    expect(loaded[0].status).toBe("accepted");
    expect(loaded[0].job.title).toBe("Développeur full-stack (senior)");
  });

  it("keeps each user's applications separate", async () => {
    const alice = await createUser();
    const bob = await createUser();

    await saveApplicationToRelationalStore(db, {
      userId: alice.id,
      position: 0,
      application: buildApplication({ jobOverrides: { id: "alice-job" } }),
    });
    await saveApplicationToRelationalStore(db, {
      userId: bob.id,
      position: 0,
      application: buildApplication({ jobOverrides: { id: "bob-job" } }),
    });

    const aliceApplications = await listApplicationsFromRelationalStore(alice.id);
    const bobApplications = await listApplicationsFromRelationalStore(bob.id);

    expect(aliceApplications.map((entry) => entry.job.id)).toEqual(["alice-job"]);
    expect(bobApplications.map((entry) => entry.job.id)).toEqual(["bob-job"]);
  });

  it("preserves the submitted order", async () => {
    const user = await createUser();
    const jobIds = ["job-c", "job-a", "job-b"];

    for (const [position, jobId] of jobIds.entries()) {
      await saveApplicationToRelationalStore(db, {
        userId: user.id,
        position,
        application: buildApplication({ jobOverrides: { id: jobId } }),
      });
    }

    const loaded = await listApplicationsFromRelationalStore(user.id);

    expect(loaded.map((entry) => entry.job.id)).toEqual(jobIds);
  });

  it("deletes only the targeted application", async () => {
    const user = await createUser();

    await saveApplicationToRelationalStore(db, {
      userId: user.id,
      position: 0,
      application: buildApplication({ jobOverrides: { id: "keep-me" } }),
    });
    await saveApplicationToRelationalStore(db, {
      userId: user.id,
      position: 1,
      application: buildApplication({ jobOverrides: { id: "delete-me" } }),
    });

    await deleteApplicationFromRelationalStore(db, user.id, "delete-me");

    const loaded = await listApplicationsFromRelationalStore(user.id);
    expect(loaded.map((entry) => entry.job.id)).toEqual(["keep-me"]);
    expect(await loadApplicationFromRelationalStore(user.id, "delete-me")).toBeNull();
  });
});

function buildApplication(
  overrides: Partial<JobApplication> & { jobOverrides?: Partial<Job> } = {}
): JobApplication {
  const { jobOverrides, ...applicationOverrides } = overrides;

  const job: Job = {
    id: "job-1",
    title: "Développeur full-stack",
    company: "Forem",
    location: "Namur",
    contractType: "CDI",
    publicationDate: "2026-03-01T09:00:00.000Z",
    url: "https://example.test/offre/job-1",
    source: "forem",
    ...jobOverrides,
  };

  return {
    job,
    appliedAt: "2026-03-10T09:00:00.000Z",
    followUpDueAt: "2026-03-17T09:00:00.000Z",
    status: "in_progress",
    updatedAt: "2026-03-10T09:00:00.000Z",
    ...applicationOverrides,
  };
}
