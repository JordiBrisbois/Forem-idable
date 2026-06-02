import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { CoachUserSheet } from "@/features/coach/components/CoachUserSheet";
import { CoachUserSummary } from "@/types/coach";
import { JobApplication } from "@/types/application";

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div>{children}</div> : null,
  SheetContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  SheetDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

vi.mock("@/components/ui/local-pagination", () => ({
  LocalPagination: () => <div data-testid="pagination" />,
}));

vi.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  CollapsibleContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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

vi.mock("@/features/coach/components/CoachUserSheetDialogs", () => ({
  CoachUserSheetDialogs: () => null,
}));

vi.mock("@/features/coach/components/CoachApplicationEditor", () => ({
  CoachApplicationEditor: ({
    draft,
    onDraftChange,
    onSave,
  }: {
    draft: { title: string };
    onDraftChange: (updater: (draft: { title: string }) => { title: string }) => void;
    onSave: () => void;
  }) => (
    <div>
      <label htmlFor="editor-title">Titre</label>
      <input
        id="editor-title"
        value={draft.title}
        onChange={(event) =>
          onDraftChange((current) => ({ ...current, title: event.target.value }))
        }
      />
      <button type="button" onClick={onSave}>
        Sauver édition
      </button>
    </div>
  ),
}));

function buildApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    job: {
      id: "job-1",
      title: "Développeur Frontend",
      company: "ACME",
      location: "Liège",
      contractType: "CDI",
      publicationDate: "2026-03-01T10:00:00.000Z",
      url: "https://example.com/job-1",
      source: "forem",
    },
    sourceType: "tracked",
    appliedAt: "2026-03-10T09:00:00.000Z",
    followUpDueAt: "2026-03-17T09:00:00.000Z",
    followUpEnabled: true,
    status: "in_progress",
    updatedAt: "2026-03-10T09:00:00.000Z",
    ...overrides,
  };
}

function buildUser(application: JobApplication): CoachUserSummary {
  return {
    id: 42,
    email: "user@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    role: "user",
    groupIds: [1],
    groupNames: ["Groupe A"],
    applicationCount: 1,
    interviewCount: 0,
    dueCount: 1,
    acceptedCount: 0,
    rejectedCount: 0,
    inProgressCount: 1,
    latestActivityAt: "2026-03-10T09:00:00.000Z",
    lastSeenAt: "2026-03-10T09:00:00.000Z",
    lastCoachActionAt: "2026-03-10T09:00:00.000Z",
    trackingPhase: "job_search",
    hasAcceptedStage: false,
    hasAcceptedJob: false,
    applications: [application],
  };
}

function renderSheet(user: CoachUserSummary, overrides: Partial<ComponentProps<typeof CoachUserSheet>> = {}) {
  const props: ComponentProps<typeof CoachUserSheet> = {
    currentUserId: 1,
    isAdmin: true,
    canEditUser: true,
    canManageApiKeys: true,
    open: true,
    user,
    initialJobId: user.applications[0]?.job.id ?? null,
    savingCoachNoteKey: null,
    onOpenChange: vi.fn(),
    onExport: vi.fn(),
    onOpenApiKeys: vi.fn(),
    onOpenImport: vi.fn(),
    onEdit: vi.fn(),
    onDeleteUser: vi.fn(),
    onOpenPhaseChange: vi.fn(),
    onSavePrivateCoachNote: vi.fn(async () => true),
    onCreateSharedCoachNote: vi.fn(async () => true),
    onUpdateSharedCoachNote: vi.fn(async () => true),
    onDeleteSharedCoachNote: vi.fn(async () => true),
    onUpdateApplication: vi.fn(async () => true),
    onDeleteApplication: vi.fn(async () => true),
    ...overrides,
  };

  render(<CoachUserSheet {...props} />);
  return props;
}

describe("CoachUserSheet", () => {
  it("saves a private note and creates a shared note from the expanded sheet", async () => {
    const application = buildApplication({
      privateCoachNote: {
        content: "Note initiale",
        createdAt: "2026-03-10T09:00:00.000Z",
        updatedAt: "2026-03-10T09:00:00.000Z",
        createdBy: {
          id: 7,
          firstName: "Coach",
          lastName: "Demo",
          email: "coach@example.com",
          role: "coach",
        },
        contributors: [
          {
            id: 7,
            firstName: "Coach",
            lastName: "Demo",
            email: "coach@example.com",
            role: "coach",
          },
        ],
      },
      sharedCoachNotes: [],
    });
    const user = buildUser(application);
    const props = renderSheet(user);

    fireEvent.change(
      screen.getByPlaceholderText("Note privée commune pour l'équipe coach..."),
      { target: { value: "Note mise à jour" } }
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(props.onSavePrivateCoachNote).toHaveBeenCalledWith(42, "job-1", "Note mise à jour");
    });

    fireEvent.click(screen.getByRole("button", { name: /Ajouter une note partagée/i }));
    fireEvent.change(
      screen.getByPlaceholderText("Message ou consigne visible par le bénéficiaire..."),
      { target: { value: "Informer sur le suivi" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /^Ajouter$/i }));

    await waitFor(() => {
      expect(props.onCreateSharedCoachNote).toHaveBeenCalledWith(42, "job-1", "Informer sur le suivi");
    });
  });

  it("edits a manual application and sends the manual job patch", async () => {
    const manualApplication = buildApplication({
      job: {
        id: "manual-1",
        title: "Candidature spontanée",
        company: "ACME",
        location: "Namur",
        contractType: "CDD",
        publicationDate: "2026-03-01T10:00:00.000Z",
        url: "#",
        source: "forem",
      },
      sourceType: "manual",
    });
    const user = buildUser(manualApplication);
    const props = renderSheet(user);

    fireEvent.click(screen.getByRole("button", { name: /éditer la candidature/i }));
    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "Candidature spontanée senior" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sauver édition" }));

    await waitFor(() => {
      expect(props.onUpdateApplication).toHaveBeenCalledWith(
        42,
        "manual-1",
        expect.objectContaining({
          job: expect.objectContaining({
            title: "Candidature spontanée senior",
          }),
        })
      );
    });

    const patch = vi.mocked(props.onUpdateApplication).mock.calls[0]?.[2];
    expect(patch?.job).not.toHaveProperty("id");
  });
});
