import { fireEvent, render, screen } from "@testing-library/react";
import { ApplicationsInsights } from "./ApplicationsInsights";

describe("ApplicationsInsights", () => {
  it("updates search and quick filters", () => {
    const onSearchChange = vi.fn();
    const onModeFilterChange = vi.fn();

    render(
      <ApplicationsInsights
        totalCount={12}
        dueCount={3}
        upcomingInterviewCount={2}
        closedCount={4}
        coachUpdateCount={1}
        hasCoachContext
        search=""
        modeFilter="all"
        onSearchChange={onSearchChange}
        onModeFilterChange={onModeFilterChange}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/rechercher une entreprise/i), {
      target: { value: "Acme" },
    });
    fireEvent.click(screen.getAllByRole("radio", { name: /filtrer: manuel/i })[0]);

    expect(onSearchChange).toHaveBeenCalledWith("Acme");
    expect(onModeFilterChange).toHaveBeenCalledWith("manual");
  });

  it("shows the coach hint when coach updates are present", () => {
    render(
      <ApplicationsInsights
        totalCount={12}
        dueCount={3}
        upcomingInterviewCount={2}
        closedCount={4}
        coachUpdateCount={2}
        hasCoachContext
        search=""
        modeFilter="all"
        onSearchChange={vi.fn()}
        onModeFilterChange={vi.fn()}
      />
    );

    expect(screen.getByText("Vue d'ensemble")).toBeInTheDocument();
    expect(
      screen.getByText("2 candidatures avec un nouveau retour coach.")
    ).toBeInTheDocument();
  });
});
