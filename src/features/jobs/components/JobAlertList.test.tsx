import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { JobAlertSummary } from "@/features/jobs/hooks/useJobAlerts";
import { JobAlertList } from "./JobAlertList";

const alert: JobAlertSummary = {
  id: 12,
  name: "Développeur à Namur",
  keywords: ["développeur"],
  booleanMode: "OR",
  goal: "job",
  contractTypes: ["CDI"],
  regimes: ["Temps plein"],
  sectors: [],
  languages: [],
  frequency: "daily",
  isActive: true,
  createdAt: "2026-03-01T10:00:00.000Z",
  lastSentAt: null,
};

describe("JobAlertList", () => {
  it("explains how to create a first alert", () => {
    render(<JobAlertList alerts={[]} isLoading={false} deletingId={null} onDelete={vi.fn()} />);

    expect(screen.getByText(/aucune alerte pour l'instant/i)).toBeVisible();
  });

  it("shows the criteria and the sending state of each alert", () => {
    render(
      <JobAlertList alerts={[alert]} isLoading={false} deletingId={null} onDelete={vi.fn()} />
    );

    expect(screen.getByText("Développeur à Namur")).toBeVisible();
    expect(screen.getByText(/développeur · CDI · Temps plein/)).toBeVisible();
    expect(screen.getByText(/en attente de la première offre/i)).toBeVisible();
    expect(screen.getByText("Active")).toBeVisible();
    expect(screen.getByText("1 email/jour")).toBeVisible();
  });

  it("marks an unsubscribed alert instead of hiding it", () => {
    render(
      <JobAlertList
        alerts={[{ ...alert, isActive: false, lastSentAt: "2026-03-02T08:00:00.000Z" }]}
        isLoading={false}
        deletingId={null}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("Désinscrite")).toBeVisible();
    expect(screen.getByText(/dernier envoi le/i)).toBeVisible();
  });

  it("deletes the alert the user picked", () => {
    const onDelete = vi.fn();
    render(
      <JobAlertList alerts={[alert]} isLoading={false} deletingId={null} onDelete={onDelete} />
    );

    fireEvent.click(screen.getByRole("button", { name: /supprimer l'alerte/i }));

    expect(onDelete).toHaveBeenCalledWith(12);
  });
});
