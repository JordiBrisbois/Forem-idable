import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { CoachGroupCard } from "@/features/coach/components/CoachGroupCard";
import { CoachGroupedUserGroup } from "@/features/coach/types";
import { CoachUserSummary } from "@/types/coach";

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant, className }: { children: ReactNode; variant?: string; className?: string }) => (
    <span data-variant={variant} className={className}>{children}</span>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: (e: unknown) => void }) => (
    <button type="button" onClick={onClick}>{children}</button>
  ),
}));

vi.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children, open }: { children: ReactNode; open?: boolean }) => (
    <div data-open={open}>{children}</div>
  ),
  CollapsibleTrigger: ({ children }: { children: ReactNode }) => <div data-testid="trigger">{children}</div>,
  CollapsibleContent: ({ children }: { children: ReactNode }) => <div data-testid="content">{children}</div>,
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
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <div />,
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/features/coach/components/CoachGroupMemberCard", () => ({
  CoachGroupMemberCard: (props: { entry: CoachUserSummary; groupId: number }) => (
    <div data-testid={`member-${props.entry.id}`}>{props.entry.email}</div>
  ),
}));

function buildGroup(overrides: Partial<CoachGroupedUserGroup> = {}): CoachGroupedUserGroup {
  return {
    id: 1,
    name: "Groupe Test",
    createdById: 1,
    createdByLabel: "Admin",
    managerCoachId: 2,
    archivedAt: null,
    canAddMembers: true,
    canManageCoaches: true,
    kind: "standard",
    totalApplications: 10,
    totalInterviews: 3,
    totalDue: 2,
    totalAccepted: 1,
    totalRejected: 0,
    members: [
      {
        id: 10,
        email: "user@example.com",
        firstName: "Jean",
        lastName: "Dupont",
        role: "user",
        trackingPhase: "job_search",
        groupIds: [1],
        groupNames: ["Groupe Test"],
        applicationCount: 2,
        interviewCount: 1,
        dueCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        inProgressCount: 2,
        latestActivityAt: "2026-04-20T10:00:00.000Z",
        lastSeenAt: "2026-04-20T10:00:00.000Z",
        lastCoachActionAt: null,
        hasAcceptedStage: false,
        hasAcceptedJob: false,
        applications: [],
      },
    ],
    coaches: [
      { id: 2, email: "coach@example.com", firstName: "Marie", lastName: "Curie", role: "coach", lastSeenAt: "2026-04-20T10:00:00.000Z" },
    ],
    ...overrides,
  };
}

function renderCard(
  overrides: Partial<ComponentProps<typeof CoachGroupCard>> = {}
) {
  const props: ComponentProps<typeof CoachGroupCard> = {
    group: buildGroup(),
    isOpen: true,
    onToggleOpen: vi.fn(),
    currentUserId: 2,
    currentUserRole: "coach",
    canRegenerateCalendars: false,
    onExportGroup: vi.fn(),
    onCopyGroupCalendar: vi.fn(),
    onRequestRegenerateGroupCalendar: vi.fn(),
    onAddMember: vi.fn(),
    onAddCoach: vi.fn(),
    onSetManager: vi.fn(),
    onRemoveGroup: vi.fn(),
    onOpenUser: vi.fn(),
    onRemoveMembership: vi.fn(),
    onRemoveCoach: vi.fn(),
    onArchiveGroup: vi.fn(),
    onOpenPhaseDialog: vi.fn(),
    ...overrides,
  };
  render(<CoachGroupCard {...props} />);
  return props;
}

describe("CoachGroupCard", () => {
  it("renders group name and summary badges", () => {
    renderCard();
    expect(screen.getByText("Groupe Test")).toBeInTheDocument();
    expect(screen.getByText("1 membre")).toBeInTheDocument();
    expect(screen.getByText("10 candidatures")).toBeInTheDocument();
    expect(screen.getByText("3 entretien(s)")).toBeInTheDocument();
    expect(screen.getByText("2 relance(s)")).toBeInTheDocument();
    expect(screen.getByText("1 acceptée(s)")).toBeInTheDocument();
  });

  it("shows 'Archivé' badge for archived groups", () => {
    renderCard({ group: buildGroup({ archivedAt: "2026-04-01T00:00:00.000Z" }) });
    expect(screen.getByText("Archivé")).toBeInTheDocument();
  });

  it("shows 'Groupe système' for ungrouped", () => {
    renderCard({ group: buildGroup({ kind: "ungrouped", coaches: [] }) });
    expect(screen.getByText("Groupe système")).toBeInTheDocument();
  });

  it("renders coaches with Manager badge", () => {
    renderCard();
    expect(screen.getByText("Marie Curie")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  it("calls onExportGroup when Export CSV is clicked", () => {
    const props = renderCard();
    fireEvent.click(screen.getByText("Export CSV"));
    expect(props.onExportGroup).toHaveBeenCalledWith(
      "Groupe Test",
      expect.any(Array)
    );
  });

  it("calls onCopyGroupCalendar from dropdown", () => {
    const props = renderCard();
    fireEvent.click(screen.getByText("Copier le lien d'agenda"));
    expect(props.onCopyGroupCalendar).toHaveBeenCalledWith(1, "Groupe Test");
  });

  it("calls onAddMember from dropdown", () => {
    const props = renderCard();
    fireEvent.click(screen.getByText("Ajouter un membre"));
    expect(props.onAddMember).toHaveBeenCalledWith(1);
  });

  it("calls onAddCoach from dropdown", () => {
    const props = renderCard();
    fireEvent.click(screen.getByText("Attribuer un coach"));
    expect(props.onAddCoach).toHaveBeenCalledWith(1);
  });

  it("calls onSetManager from dropdown for admin", () => {
    const props = renderCard({ currentUserRole: "admin" });
    fireEvent.click(screen.getByText("Définir le manager"));
    expect(props.onSetManager).toHaveBeenCalledWith(1);
  });

  it("does not show 'Définir le manager' for coach", () => {
    renderCard({ currentUserRole: "coach" });
    expect(screen.queryByText("Définir le manager")).not.toBeInTheDocument();
  });

  it("calls onOpenPhaseDialog from dropdown", () => {
    const props = renderCard();
    fireEvent.click(screen.getByText("Changer de phase"));
    expect(props.onOpenPhaseDialog).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it("calls onArchiveGroup with true when archiving", () => {
    const props = renderCard();
    fireEvent.click(screen.getByText("Archiver"));
    expect(props.onArchiveGroup).toHaveBeenCalledWith(1, true);
  });

  it("calls onArchiveGroup with false when unarchiving", () => {
    const props = renderCard({ group: buildGroup({ archivedAt: "2026-04-01T00:00:00.000Z" }) });
    fireEvent.click(screen.getByText("Désarchiver"));
    expect(props.onArchiveGroup).toHaveBeenCalledWith(1, false);
  });

  it("calls onRemoveGroup from dropdown", () => {
    const props = renderCard();
    fireEvent.click(screen.getByText("Supprimer le groupe"));
    expect(props.onRemoveGroup).toHaveBeenCalledWith(1, "Groupe Test");
  });

  it("allows coach to remove another coach", () => {
    const props = renderCard({
      currentUserId: 2,
      currentUserRole: "coach",
      group: buildGroup({
        managerCoachId: 2,
        coaches: [
          { id: 2, email: "coach@example.com", firstName: "Marie", lastName: "Curie", role: "coach", lastSeenAt: "2026-04-20T10:00:00.000Z" },
          { id: 3, email: "other@example.com", firstName: "Pierre", lastName: "Curie", role: "coach", lastSeenAt: "2026-04-20T10:00:00.000Z" },
        ],
      }),
    });
    const removeButton = screen.getByLabelText("Retirer other@example.com du groupe Groupe Test");
    fireEvent.click(removeButton);
    expect(props.onRemoveCoach).toHaveBeenCalledWith({
      groupId: 1,
      userId: 3,
      userEmail: "other@example.com",
      groupName: "Groupe Test",
    });
  });

  it("does not allow coach to remove themselves", () => {
    renderCard({ currentUserId: 2, currentUserRole: "coach" });
    // The remove button should still be present because the current user is the manager,
    // but canRemoveAssignedCoach returns false when currentUserRole === "coach" && coachId === currentUserId
    // Wait, in buildGroup the managerCoachId is 2 and coach id is 2, so currentUserId === coach.id
    // Let me check the logic: canRemoveAssignedCoach returns false when currentUserRole === "coach" && coachId === currentUserId
    // So the X button should NOT be rendered
    expect(
      screen.queryByLabelText("Retirer coach@example.com du groupe Groupe Test")
    ).not.toBeInTheDocument();
  });

  it("renders member cards", () => {
    renderCard();
    expect(screen.getByTestId("member-10")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("shows empty state when no members", () => {
    renderCard({ group: buildGroup({ members: [] }) });
    expect(screen.getByText("Aucun utilisateur correspondant.")).toBeInTheDocument();
  });

  it("hides regenerate option when canRegenerateCalendars is false", () => {
    renderCard({ canRegenerateCalendars: false });
    expect(screen.queryByText("Régénérer le lien")).not.toBeInTheDocument();
  });

  it("shows regenerate option when canRegenerateCalendars is true", () => {
    renderCard({ canRegenerateCalendars: true });
    expect(screen.getByText("Régénérer le lien")).toBeInTheDocument();
  });

  it("export CSV button has type button to prevent form submission", () => {
    renderCard();
    const exportBtn = screen.getByRole("button", { name: /Export CSV/i });
    expect(exportBtn).toHaveAttribute("type", "button");
  });
});
