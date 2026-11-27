import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

function buildJobs(count: number, startAt = 1): Job[] {
  return Array.from({ length: count }, (_, index) => buildJob(startAt + index));
}

/**
 * Pagination is server-side: the table renders the page it is given and reports
 * page changes upward. It must not slice `data` itself, otherwise the total and
 * the page size come from two places.
 */
describe("JobTable pagination", () => {
  const baseProps = {
    totalCount: 42,
    pageIndex: 1,
    pageSize: 15,
    onPageChange: vi.fn(),
  };

  it("renders every row of the page it receives", () => {
    render(<JobTable {...baseProps} data={buildJobs(15)} />);

    expect(screen.getAllByText("Offre 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Offre 15").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1-15 sur 42 offres/).length).toBeGreaterThan(0);
  });

  it("asks for the next page instead of paginating locally", () => {
    const onPageChange = vi.fn();
    render(<JobTable {...baseProps} onPageChange={onPageChange} data={buildJobs(15)} />);

    fireEvent.click(screen.getByRole("button", { name: /suivante/i }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("reports the selected page", () => {
    const onPageChange = vi.fn();
    render(<JobTable {...baseProps} onPageChange={onPageChange} data={buildJobs(15, 16)} />);

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("hides the pager when a single page holds everything", () => {
    render(
      <JobTable
        totalCount={3}
        pageIndex={1}
        pageSize={15}
        onPageChange={vi.fn()}
        data={buildJobs(3)}
      />
    );

    expect(screen.queryByText(/sur 3 offres/)).toBeNull();
  });

  it("renders an empty state without crashing", () => {
    render(<JobTable {...baseProps} totalCount={0} data={[]} />);

    expect(screen.queryByText(/Offre \d+/)).toBeNull();
  });
});
