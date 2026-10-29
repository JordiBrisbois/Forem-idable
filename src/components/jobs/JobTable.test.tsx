import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JobTable } from "@/components/jobs/JobTable";
import type { Job } from "@/types/job";

function buildJob(index: number): Job {
  return {
    id: String(index),
    title: `Offre ${index}`,
    company: "ACME",
    location: "Liège",
    contractType: "CDI",
    publicationDate: "2026-02-23",
    url: `https://example.com/${index}`,
    source: "forem",
  };
}

function buildJobs(count: number): Job[] {
  return Array.from({ length: count }, (_, index) => buildJob(index + 1));
}

/**
 * Guards the pagination wiring of the table, which is the part TanStack Table v9
 * changed (`features` + row model registration, `table.state` instead of
 * `table.getState()`). The page size is 15.
 */
describe("JobTable pagination", () => {
  it("renders only the first page when there are more results", () => {
    render(<JobTable data={buildJobs(17)} />);

    expect(screen.getAllByText("Offre 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Offre 15").length).toBeGreaterThan(0);
    expect(screen.queryByText("Offre 16")).toBeNull();
  });

  it("renders every row when the results fit on one page", () => {
    render(<JobTable data={buildJobs(3)} />);

    expect(screen.getAllByText("Offre 3").length).toBeGreaterThan(0);
  });

  it("renders an empty state without crashing", () => {
    render(<JobTable data={[]} />);

    expect(screen.queryByText(/Offre \d+/)).toBeNull();
  });
});
