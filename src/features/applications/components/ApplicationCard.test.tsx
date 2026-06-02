import { fireEvent, render, screen } from "@testing-library/react";
import { ApplicationCard } from "./ApplicationCard";
import { JobApplication } from "@/types/application";

vi.mock("@/features/applications/components/ApplicationsOfferButtons", () => ({
  ApplicationsOfferButtons: () => <div>offer-buttons</div>,
}));

const application: JobApplication = {
  job: {
    id: "job-1",
    title: "Frontend Developer",
    company: "Acme",
    location: "Brussels",
    contractType: "CDI",
    publicationDate: "2026-03-10T10:00:00.000Z",
    url: "https://example.com/job-1",
    source: "forem",
  },
  appliedAt: "2026-03-11T10:00:00.000Z",
  followUpDueAt: "2026-03-18T10:00:00.000Z",
  status: "in_progress",
  updatedAt: "2026-03-11T10:00:00.000Z",
};

describe("ApplicationCard", () => {
  it("opens details when the card is clicked", () => {
    const onOpenDetails = vi.fn();

    render(
      <ApplicationCard
        application={application}
        now={new Date("2026-03-19T10:00:00.000Z")}
        isSelected={false}
        hasUnreadCoachUpdate={false}
        onToggleSelection={vi.fn()}
        onOpenDetails={onOpenDetails}
        onApplyStatus={vi.fn()}
        onMarkFollowUpDone={vi.fn()}
        onOpenInterview={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Frontend Developer"));

    expect(onOpenDetails).toHaveBeenCalledWith("job-1");
  });

  it("does not open details when selecting the checkbox", () => {
    const onOpenDetails = vi.fn();
    const onToggleSelection = vi.fn();

    render(
      <ApplicationCard
        application={application}
        now={new Date("2026-03-19T10:00:00.000Z")}
        isSelected={false}
        hasUnreadCoachUpdate={false}
        onToggleSelection={onToggleSelection}
        onOpenDetails={onOpenDetails}
        onApplyStatus={vi.fn()}
        onMarkFollowUpDone={vi.fn()}
        onOpenInterview={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText("Sélectionner la candidature"));

    expect(onToggleSelection).toHaveBeenCalledWith("job-1");
    expect(onOpenDetails).not.toHaveBeenCalled();
  });

  it("triggers the follow-up action without opening details", () => {
    const onOpenDetails = vi.fn();
    const onMarkFollowUpDone = vi.fn();

    render(
      <ApplicationCard
        application={application}
        now={new Date("2026-03-19T10:00:00.000Z")}
        isSelected={false}
        hasUnreadCoachUpdate={false}
        onToggleSelection={vi.fn()}
        onOpenDetails={onOpenDetails}
        onApplyStatus={vi.fn()}
        onMarkFollowUpDone={onMarkFollowUpDone}
        onOpenInterview={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /relancer/i }));

    expect(onMarkFollowUpDone).toHaveBeenCalledWith("job-1");
    expect(onOpenDetails).not.toHaveBeenCalled();
  });
});
