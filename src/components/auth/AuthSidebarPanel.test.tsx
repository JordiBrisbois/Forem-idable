import { render, screen } from "@testing-library/react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthSidebarPanel } from "./AuthSidebarPanel";

const mockUseAuth = vi.fn();

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/components/auth/ForgotPasswordDialog", () => ({
  ForgotPasswordDialog: () => null,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("AuthSidebarPanel", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders compact guest actions when no user is connected", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      refresh: vi.fn(),
      setUser: vi.fn(),
    });

    render(
      <SidebarProvider>
        <AuthSidebarPanel />
      </SidebarProvider>
    );

    expect(screen.getByRole("button", { name: "Connexion" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inscription" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ouvrir le menu du compte" })).not.toBeInTheDocument();
  });

  it("renders a compact account trigger for a connected user", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: "ada@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        role: "admin",
      },
      isLoading: false,
      refresh: vi.fn(),
      setUser: vi.fn(),
    });

    render(
      <SidebarProvider>
        <AuthSidebarPanel />
      </SidebarProvider>
    );

    expect(screen.getByRole("button", { name: "Ouvrir le menu du compte" })).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Connexion" })).not.toBeInTheDocument();
  });
});
