import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobAlertSummary } from "@/features/jobs/hooks/useJobAlerts";

const alertsState = {
  alerts: [] as JobAlertSummary[] | null,
  count: 0,
  isLoading: false,
  deletingId: null as number | null,
  create: vi.fn(),
  remove: vi.fn(),
  removeAll: vi.fn(),
  setActive: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("@/features/jobs/hooks/useJobAlerts", () => ({
  useJobAlerts: () => alertsState,
}));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

import { JobAlertsSection } from "./JobAlertsSection";

function alert(overrides: Partial<JobAlertSummary> = {}): JobAlertSummary {
  return {
    id: 1,
    name: "Développeur à Namur",
    keywords: ["développeur"],
    booleanMode: "OR",
    goal: "job",
    contractTypes: ["CDI"],
    regimes: [],
    sectors: [],
    languages: [],
    frequency: "daily",
    isActive: true,
    createdAt: "2026-03-01T10:00:00.000Z",
    lastSentAt: null,
    ...overrides,
  };
}

describe("JobAlertsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    alertsState.alerts = [];
    alertsState.count = 0;
    alertsState.setActive.mockResolvedValue(true);
    alertsState.remove.mockResolvedValue(true);
    alertsState.removeAll.mockResolvedValue(true);
  });

  it("invites the user to create a first alert and links to the search", () => {
    render(<JobAlertsSection enabled />);

    expect(screen.getByText(/vous n'avez aucune alerte/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /chercher des offres/i })).toHaveAttribute("href", "/");
  });

  it("lists the alerts with their state", () => {
    alertsState.alerts = [alert(), alert({ id: 2, name: "Stages data", isActive: false })];
    alertsState.count = 2;

    render(<JobAlertsSection enabled />);

    expect(screen.getByText("Développeur à Namur")).toBeVisible();
    expect(screen.getByText("Stages data")).toBeVisible();
    expect(screen.getByText("En pause")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
  });

  it("pauses an alert from its checkbox", async () => {
    alertsState.alerts = [alert()];
    alertsState.count = 1;

    render(<JobAlertsSection enabled />);

    fireEvent.click(screen.getByRole("checkbox", { name: /recevoir les emails/i }));

    await waitFor(() => expect(alertsState.setActive).toHaveBeenCalledWith(1, false));
  });

  it("deletes one alert", async () => {
    alertsState.alerts = [alert()];
    alertsState.count = 1;

    render(<JobAlertsSection enabled />);

    fireEvent.click(screen.getByRole("button", { name: /supprimer l'alerte/i }));

    await waitFor(() => expect(alertsState.remove).toHaveBeenCalledWith(1));
  });

  it("asks for confirmation before unsubscribing from everything", async () => {
    alertsState.alerts = [alert()];
    alertsState.count = 1;

    render(<JobAlertsSection enabled />);

    fireEvent.click(screen.getByRole("button", { name: /me désinscrire de tout/i }));
    fireEvent.click(await screen.findByRole("button", { name: /supprimer mes alertes/i }));

    await waitFor(() => expect(alertsState.removeAll).toHaveBeenCalledOnce());
  });
});
