import { describe, expect, it } from "vitest";
import { normalizeApplicationPatch } from "@/lib/server/requestSchemas";

describe("requestSchemas", () => {
  it("preserves explicit null values when normalizing an application patch", () => {
    const patch = normalizeApplicationPatch("job-1", {
      status: "in_progress",
      interviewAt: null,
      interviewDetails: null,
      lastFollowUpAt: null,
    });

    expect(patch).toMatchObject({
      status: "in_progress",
      interviewAt: null,
      interviewDetails: null,
      lastFollowUpAt: null,
    });
    expect(Object.prototype.hasOwnProperty.call(patch, "followUpDueAt")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, "job")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, "appliedAt")).toBe(false);
  });

  it("omits fields that are not present in the incoming patch", () => {
    const patch = normalizeApplicationPatch("job-1", {
      status: "interview",
    });

    expect(Object.prototype.hasOwnProperty.call(patch, "interviewAt")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, "interviewDetails")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, "lastFollowUpAt")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, "followUpDueAt")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, "notes")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, "proofs")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, "followUpEnabled")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, "appliedAt")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, "job")).toBe(false);
  });
});
