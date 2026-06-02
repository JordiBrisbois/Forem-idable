import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AccountPage from "./page";

const mockUseAuth = vi.fn();
const mockUseSettings = vi.fn();
const { mockToastSuccess, mockToastError, mockToastWarning, mockToast } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockToastWarning: vi.fn(),
  mockToast: vi.fn(),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => mockUseSettings(),
}));

vi.mock("@/components/auth/AccountAccessPrompt", () => ({
  AccountAccessPrompt: ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <div>
      {title}
      {description}
    </div>
  ),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(mockToast, {
    success: mockToastSuccess,
    error: mockToastError,
    warning: mockToastWarning,
  }),
}));

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(global, "fetch").mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? "GET";

      if (url === "/api/account/data-export" && method === "GET") {
        return new Response(JSON.stringify({ requests: [] }), { status: 200 });
      }

      if (url === "/api/account/deletion-request" && method === "GET") {
        return new Response(JSON.stringify({ requests: [] }), { status: 200 });
      }

      return new Response(JSON.stringify({ error: "Unhandled fetch in test" }), { status: 500 });
    });

    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: "user@example.com",
        firstName: "Jordi",
        lastName: "Brisbois",
        role: "user",
      },
      isLoading: false,
      refresh: vi.fn().mockResolvedValue(undefined),
      setUser: vi.fn(),
    });

    mockUseSettings.mockReturnValue({
      settings: { defaultSearchMode: "OR" },
      updateSettings: vi.fn(),
      isLoaded: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits the profile form with validated values", async () => {
    const fetchMock = vi.mocked(global.fetch).mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? "GET";

      if (url === "/api/account/data-export" && method === "GET") {
        return new Response(JSON.stringify({ requests: [] }), { status: 200 });
      }

      if (url === "/api/account/deletion-request" && method === "GET") {
        return new Response(JSON.stringify({ requests: [] }), { status: 200 });
      }

      if (url === "/api/account" && method === "PATCH") {
        return new Response(
          JSON.stringify({
            user: {
              id: 1,
              email: "user@example.com",
              firstName: "Jordan",
              lastName: "Brisbois",
              role: "user",
            },
          }),
          { status: 200 }
        );
      }

      return new Response(JSON.stringify({ error: "Unhandled fetch in test" }), { status: 500 });
    });

    render(<AccountPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Prénom")).toHaveValue("Jordi");
      expect(screen.getByLabelText("Nom")).toHaveValue("Brisbois");
    });

    const firstNameInput = screen.getByLabelText("Prénom");
    fireEvent.change(firstNameInput, { target: { value: "Jordan" } });
    fireEvent.submit(firstNameInput.closest("form")!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Jordan",
          lastName: "Brisbois",
        }),
      });
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Nom et prénom mis à jour.", {
        description: "Mise à jour du profil",
      });
    });
  });

  it("enables the profile button after removing a single character", async () => {
    render(<AccountPage />);

    const submitButton = screen.getByRole("button", { name: "Enregistrer le profil" });

    await waitFor(() => {
      expect(screen.getByLabelText("Prénom")).toHaveValue("Jordi");
    });

    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Prénom"), {
      target: { value: "Jord" },
    });

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it("shows a field error when password confirmation does not match", async () => {
    render(<AccountPage />);

    fireEvent.change(screen.getByLabelText("Mot de passe actuel"), {
      target: { value: "oldpassword" },
    });
    fireEvent.change(screen.getByLabelText("Nouveau mot de passe"), {
      target: { value: "motdepasse1" },
    });
    fireEvent.change(screen.getByLabelText("Confirmer le mot de passe"), {
      target: { value: "motdepasse2" },
    });

    expect(await screen.findByText("Les mots de passe ne correspondent pas.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Changer le mot de passe" })).toBeDisabled();
  });

  it("renders password form with current password field", async () => {
    render(<AccountPage />);

    expect(screen.getByLabelText("Mot de passe actuel")).toBeInTheDocument();
    expect(screen.getByLabelText("Nouveau mot de passe")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmer le mot de passe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Changer le mot de passe" })).toBeDisabled();
  });

  it("updates the default search mode through the toggle group", async () => {
    const updateSettings = vi.fn();

    mockUseSettings.mockReturnValue({
      settings: { defaultSearchMode: "OR" },
      updateSettings,
      isLoaded: true,
    });

    render(<AccountPage />);

    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: "ET" }));
    });

    expect(updateSettings).toHaveBeenCalledWith({ defaultSearchMode: "AND" });
  });
});
