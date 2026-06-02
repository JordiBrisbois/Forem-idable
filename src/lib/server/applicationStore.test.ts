import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock("@/lib/server/db", () => ({
  db: {
    query: mockQuery,
  },
}));

import { getRelationalApplicationRecordById } from "@/lib/server/applicationStore";

describe("applicationStore", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("preserves persisted sourceType when loading a relational application record", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 501,
            user_id: 42,
            job_id: "forem-501",
            position: 0,
            status: "in_progress",
            applied_at: "2026-03-20T10:00:00.000Z",
            follow_up_due_at: "2026-03-27T10:00:00.000Z",
            follow_up_enabled: true,
            last_follow_up_at: null,
            interview_at: null,
            interview_details: null,
            beneficiary_notes: null,
            proofs: null,
            source_type: "manual",
            updated_at: "2026-03-20T10:00:00.000Z",
            title: "Candidature importée",
            company: "Forem",
            location: "Namur",
            contract_type: "CDD",
            url: "https://example.test/offre/501",
            publication_date: "2026-03-18T10:00:00.000Z",
            provider: "forem",
            external_job_id: "ext-501",
            pdf_url: null,
            description: null,
            raw_payload: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const record = await getRelationalApplicationRecordById(501);

    expect(record).not.toBeNull();
    expect(record?.application.sourceType).toBe("manual");
  });
});
