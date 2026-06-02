import { fireEvent, render, screen } from "@testing-library/react";
import { DeleteApplicationDialog } from "./DeleteApplicationDialog";
import { JobApplication } from "@/types/application";

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

describe("DeleteApplicationDialog", () => {
  it("renders the destructive confirmation copy and triggers callbacks", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <DeleteApplicationDialog
        application={application}
        open
        onOpenChange={vi.fn()}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText(/retirera Frontend Developer de votre suivi/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /annuler/i }));
    fireEvent.click(screen.getByRole("button", { name: /supprimer/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
