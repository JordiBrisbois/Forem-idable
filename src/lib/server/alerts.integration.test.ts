import { beforeEach, expect, it } from "vitest";
import { createUser, describeWithDatabase, resetDatabase } from "@/lib/server/testFixtures";
import {
  createJobAlert,
  deleteAllJobAlerts,
  deleteJobAlert,
  setJobAlertActive,
  listDueAlerts,
  listJobAlerts,
  markJobAlertSent,
  unsubscribeJobAlert,
} from "./alerts/repository";

const input = {
  name: "Développeur à Namur",
  keywords: ["développeur"],
  locations: [],
  booleanMode: "OR" as const,
  goal: "job" as const,
  contractTypes: [] as never[],
  regimes: [],
  sectors: [],
  languages: [],
};

describeWithDatabase("job alerts (integration)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("stores an alert with a consent timestamp and a unique token", async () => {
    const user = await createUser();

    const alert = await createJobAlert(user.id, input);

    expect(alert.id).toBeGreaterThan(0);
    expect(alert.name).toBe("Développeur à Namur");
    expect(alert.unsubscribeToken).toMatch(/^[a-f0-9]{64}$/);
    expect(alert.isActive).toBe(true);
  });

  it("lists only the owner's alerts and deletes with the owner scope", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const alert = await createJobAlert(alice.id, input);
    await createJobAlert(bob.id, { ...input, name: "Bobby" });

    expect((await listJobAlerts(alice.id)).map((entry) => entry.name)).toEqual([
      "Développeur à Namur",
    ]);

    // Another user cannot delete it by guessing the id.
    expect(await deleteJobAlert(bob.id, alert.id)).toBe(false);
    expect(await deleteJobAlert(alice.id, alert.id)).toBe(true);
    expect(await listJobAlerts(alice.id)).toHaveLength(0);
  });

  it("deactivates an alert from its unsubscribe token, idempotently", async () => {
    const user = await createUser();
    const alert = await createJobAlert(user.id, input);

    expect(await unsubscribeJobAlert(alert.unsubscribeToken)).toBe(true);
    expect(await unsubscribeJobAlert(alert.unsubscribeToken)).toBe(true);

    const [stored] = await listJobAlerts(user.id);
    expect(stored.isActive).toBe(false);
  });

  it("returns due alerts only after the 20h window, with the recipient", async () => {
    const user = await createUser({ firstName: "Ada" });
    const alert = await createJobAlert(user.id, input);
    const now = new Date("2026-03-02T08:00:00Z");

    const firstRun = await listDueAlerts(now);
    expect(firstRun).toHaveLength(1);
    expect(firstRun[0]).toMatchObject({ email: user.email, firstName: "Ada" });

    await markJobAlertSent(alert.id, now);
    expect(await listDueAlerts(new Date("2026-03-02T12:00:00Z"))).toHaveLength(0);
    expect(await listDueAlerts(new Date("2026-03-03T08:00:00Z"))).toHaveLength(1);
  });

  it("excludes deactivated alerts from the digest", async () => {
    const user = await createUser();
    const alert = await createJobAlert(user.id, input);
    await unsubscribeJobAlert(alert.unsubscribeToken);

    expect(await listDueAlerts(new Date("2026-03-02T08:00:00Z"))).toHaveLength(0);
  });
});

describeWithDatabase("alert management (integration)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("pauses and resumes one alert, scoped to its owner", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const alert = await createJobAlert(alice.id, input);

    expect(await setJobAlertActive(bob.id, alert.id, false)).toBe(false);
    expect(await setJobAlertActive(alice.id, alert.id, false)).toBe(true);

    const [paused] = await listJobAlerts(alice.id);
    expect(paused.isActive).toBe(false);

    expect(await setJobAlertActive(alice.id, alert.id, true)).toBe(true);
    const [resumed] = await listJobAlerts(alice.id);
    expect(resumed.isActive).toBe(true);
  });

  it("deletes every alert of one user and nothing else", async () => {
    const alice = await createUser();
    const bob = await createUser();
    await createJobAlert(alice.id, input);
    await createJobAlert(alice.id, { ...input, name: "Deuxième" });
    await createJobAlert(bob.id, { ...input, name: "Bobby" });

    expect(await deleteAllJobAlerts(alice.id)).toBe(2);
    expect(await listJobAlerts(alice.id)).toHaveLength(0);
    expect(await listJobAlerts(bob.id)).toHaveLength(1);
    expect(await deleteAllJobAlerts(alice.id)).toBe(0);
  });
});