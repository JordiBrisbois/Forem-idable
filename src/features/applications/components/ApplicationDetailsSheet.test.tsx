import { fireEvent, render, screen } from "@testing-library/react";
import { ApplicationDetailsSheet } from "./ApplicationDetailsSheet";
import { JobApplication } from "@/types/application";

vi.mock("@/features/applications/components/ApplicationsOfferButtons", () => ({
  ApplicationsOfferButtons: () => <div>offer-buttons</div>,
}));

const manualApplication: JobApplication = {
  job: {
    id: "manual-1",
    title: "Frontend Developer",
    company: "Acme",
    location: "Brussels",
    contractType: "CDI",
    publicationDate: "2026-03-10T10:00:00.000Z",
    url: "#",
    source: "forem",
  },
  sourceType: "manual",
  appliedAt: "2026-03-11T10:00:00.000Z",
  followUpDueAt: "2026-03-18T10:00:00.000Z",
  status: "in_progress",
  updatedAt: "2026-03-11T10:00:00.000Z",
};

describe("ApplicationDetailsSheet", () => {
  it("opens manual edition fields inside the sheet", () => {
    render(
      <ApplicationDetailsSheet
        application={manualApplication}
        open
        hasUnreadCoachUpdate={false}
        notesDraft=""
        proofsDraft=""
        onOpenChange={vi.fn()}
        onApplyStatus={vi.fn()}
        onNotesDraftChange={vi.fn()}
        onProofsDraftChange={vi.fn()}
        onSaveNotes={vi.fn(async () => undefined)}
        onSaveProofs={vi.fn(async () => undefined)}
        onSaveManualDetails={vi.fn(async () => true)}
        onSaveFollowUpSettings={vi.fn(async () => true)}
        onMarkFollowUpDone={vi.fn()}
        onOpenInterview={vi.fn()}
        onRequestDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /éditer/i }));

    expect(screen.getByLabelText(/entreprise/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/intitulé/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lien de l'offre/i)).toBeInTheDocument();
  });
});
