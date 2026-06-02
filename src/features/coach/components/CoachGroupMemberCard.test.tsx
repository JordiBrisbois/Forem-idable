import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { CoachGroupMemberCard } from "@/features/coach/components/CoachGroupMemberCard";
import { CoachUserSummary } from "@/types/coach";

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant }: { children: ReactNode; variant?: string }) => (
    <span data-variant={variant}>{children}</span>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>{children}</button>
  ),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: ReactNode;
    onClick?: (e: unknown) => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@/features/coach/components/CoachPhaseBadge", () => ({
  CoachPhaseBadge: ({ phase }: { phase: string }) => <span data-testid="phase-badge">{phase}</span>,
}));

vi.mock("@/features/coach/components/CoachUserActivityMeta", () => ({
  CoachUserActivityMeta: () => <span data-testid="activity-meta" />,
}));

function buildUser(overrides: Partial<CoachUserSummary> = {}): CoachUserSummary {
  return {
    id: 1,
    email: "ada@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    role: "user",
    trackingPhase: "job_search",
    groupIds: [1],
    groupNames: ["Groupe A"],
    applicationCount: 3,
    interviewCount: 1,
    dueCount: 0,
    acceptedCount: 1,
    rejectedCount: 0,
    inProgressCount: 2,
    latestActivityAt: "2026-04-20T10:00:00.000Z",
    lastSeenAt: "2026-04-20T10:00:00.000Z",
    lastCoachActionAt: null,
    hasAcceptedStage: false,
    hasAcceptedJob: true,
    applications: [],
    ...overrides,
  };
}

function getCard() {
  return screen.getByRole("button", { name: /Ada Lovelace/i });
}

function renderCard(
  overrides: Partial<ComponentProps<typeof CoachGroupMemberCard>> = {}
) {
  const props: ComponentProps<typeof CoachGroupMemberCard> = {
    entry: buildUser(),
    groupId: 1,
    groupName: "Groupe A",
    groupKind: "standard",
    onOpenUser: vi.fn(),
    onRemoveMembership: vi.fn(),
    ...overrides,
  };
  render(<CoachGroupMemberCard {...props} />);
  return props;
}

describe("CoachGroupMemberCard", () => {
  it("renders user name, email and group names", () => {
    renderCard();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("Groupe A")).toBeInTheDocument();
  });

  it("shows 'Sans groupe' when user has no groups", () => {
    renderCard({ entry: buildUser({ groupNames: [] }) });
    expect(screen.getByText("Sans groupe")).toBeInTheDocument();
  });

  it("is accessible as a button with user name", () => {
    renderCard();
    expect(getCard()).toBeInTheDocument();
  });

  it("calls onOpenUser when card is clicked", () => {
    const props = renderCard();
    fireEvent.click(getCard());
    expect(props.onOpenUser).toHaveBeenCalledWith(1);
  });

  it("calls onOpenUser on Enter key", () => {
    const props = renderCard();
    fireEvent.keyDown(getCard(), { key: "Enter" });
    expect(props.onOpenUser).toHaveBeenCalledWith(1);
  });

  it("calls onOpenUser on Space key", () => {
    const props = renderCard();
    fireEvent.keyDown(getCard(), { key: " " });
    expect(props.onOpenUser).toHaveBeenCalledWith(1);
  });

  it("shows the remove menu for standard groups", () => {
    renderCard({ groupKind: "standard" });
    expect(screen.getByText("Retirer du groupe")).toBeInTheDocument();
  });

  it("does not show the remove menu for ungrouped", () => {
    renderCard({ groupKind: "ungrouped" });
    expect(screen.queryByText("Retirer du groupe")).not.toBeInTheDocument();
  });

  it("calls onRemoveMembership when 'Retirer du groupe' is clicked", () => {
    const props = renderCard({ groupKind: "standard" });
    fireEvent.click(screen.getByText("Retirer du groupe"));
    expect(props.onRemoveMembership).toHaveBeenCalledWith({
      groupId: 1,
      userId: 1,
      userEmail: "ada@example.com",
      groupName: "Groupe A",
    });
  });

  it("displays correct stat counts", () => {
    renderCard({
      entry: buildUser({
        applicationCount: 5,
        interviewCount: 2,
        dueCount: 1,
        acceptedCount: 3,
        rejectedCount: 4,
      }),
    });
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
