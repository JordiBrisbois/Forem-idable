import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useApplications } from "@/hooks/useApplications";
import { JobApplication } from "@/types/application";

const mockUseAuth = vi.fn();

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

const applications: JobApplication[] = [
  {
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
  },
];

function TestHarness() {
  const { applications, isLoaded, isAuthenticated } = useApplications();

  return (
    <div>
      <div data-testid="loaded">{isLoaded ? "yes" : "no"}</div>
      <div data-testid="authenticated">{isAuthenticated ? "yes" : "no"}</div>
      <div data-testid="count">{applications.length}</div>
    </div>
  );
}

function ManualEditHarness() {
  const { isLoaded, updateManualApplicationDetails } = useApplications();

  if (!isLoaded) {
    return <div>loading</div>;
  }

  return (
    <button
      type="button"
      onClick={() =>
        void updateManualApplicationDetails("job-1", applications[0].job, {
          company: "ACME",
          title: "Frontend Developer Senior",
          contractType: "CDI",
          location: "Brussels",
          url: "https://example.com/job-1",
        })
      }
    >
      save manual edit
    </button>
  );
}

describe("useApplications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an empty loaded state when the visitor is not connected", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    render(<TestHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("loaded").textContent).toBe("yes");
      expect(screen.getByTestId("authenticated").textContent).toBe("no");
      expect(screen.getByTestId("count").textContent).toBe("0");
    });
  });

  it("loads applications from the authenticated API", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
        role: "user",
      },
      isLoading: false,
    });

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ applications }), { status: 200 })
    );

    render(<TestHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("loaded").textContent).toBe("yes");
      expect(screen.getByTestId("authenticated").textContent).toBe("yes");
      expect(screen.getByTestId("count").textContent).toBe("1");
    });
  });

  it("omits the manual job id when patching manual application details", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
        role: "user",
      },
      isLoading: false,
    });

    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify({ applications }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            application: {
              ...applications[0],
              job: {
                ...applications[0].job,
                title: "Frontend Developer Senior",
              },
            },
          }),
          { status: 200 }
        )
      );

    render(<ManualEditHarness />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save manual edit/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save manual edit/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    const patchRequest = fetchSpy.mock.calls[1];
    expect(patchRequest?.[0]).toBe("/api/applications/job-1");
    const payload = JSON.parse(String((patchRequest?.[1] as RequestInit | undefined)?.body));

    expect(payload.patch.job).toMatchObject({
      title: "Frontend Developer Senior",
      company: "ACME",
      location: "Brussels",
      contractType: "CDI",
      url: "https://example.com/job-1",
      publicationDate: "2026-03-10T10:00:00.000Z",
      source: "forem",
    });
    expect(payload.patch.job).not.toHaveProperty("id");
  });
});
