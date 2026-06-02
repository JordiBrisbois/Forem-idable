import { act, fireEvent, render, screen } from "@testing-library/react";
import DashboardPage from "./page";
import { SearchQuery } from "@/types/search";
import { Job } from "@/types/job";

const mockUseHomePageState = vi.fn();

vi.mock("@/features/jobs/hooks/useHomePageState", () => ({
  useHomePageState: () => mockUseHomePageState(),
}));

vi.mock("@/components/search/SearchEngine", () => ({
  SearchEngine: ({
    onSearch,
    onOpenHistory,
  }: {
    onSearch: (state: SearchQuery) => void;
    onOpenHistory?: () => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onSearch({
            keywords: ["dev"],
            locations: [{ id: "loc1", name: "4000 Liège", type: "Localités" }],
            booleanMode: "OR",
          })
        }
      >
        trigger-search
      </button>
      {onOpenHistory ? (
        <button type="button" onClick={onOpenHistory}>
          open-history
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock("@/components/jobs/JobTable", () => ({
  JobTable: () => <div>job-table</div>,
}));

vi.mock("@/features/jobs/components/SearchHistoryPanel", () => ({
  SearchHistoryPanel: ({
    history,
    onReplay,
  }: {
    history: Array<{ state: SearchQuery }>;
    onReplay: (query: SearchQuery) => void;
  }) => (
    <button type="button" onClick={() => onReplay(history[0].state)}>
      replay-history
    </button>
  ),
}));

vi.mock("@/features/jobs/components/SelectionPanel", () => ({
  SelectionPanel: () => <div>selection-panel</div>,
}));

vi.mock("@/components/auth/AuthRequiredDialog", () => ({
  AuthRequiredDialog: () => <div>auth-required-dialog</div>,
}));

vi.mock("@/features/jobs/components/ResultsToolbar", () => ({
  ResultsToolbar: ({
    onExportAll,
    onExportSelected,
    onCopySearchLink,
  }: {
    onExportAll: () => void;
    onExportSelected: () => void;
    onCopySearchLink: () => void;
  }) => (
    <div>
      <button type="button" onClick={onExportAll}>
        export-all
      </button>
      <button type="button" onClick={onCopySearchLink}>
        copy-link
      </button>
      <button type="button" onClick={onExportSelected}>
        export-selected
      </button>
    </div>
  ),
}));

vi.mock("@/features/jobs/components/ExportDialog", () => ({
  ExportDialog: () => <div>export-dialog</div>,
}));

vi.mock("@/features/jobs/components/JobDetailsSheet", () => ({
  JobDetailsSheet: () => <div>job-details-sheet</div>,
}));

const sampleQuery: SearchQuery = {
  keywords: ["dev"],
  locations: [{ id: "loc1", name: "4000 Liège", type: "Localités" }],
  booleanMode: "OR",
};

const sampleJob: Job = {
  id: "1",
  title: "Développeur",
  location: "Liège",
  contractType: "CDI",
  publicationDate: "2026-02-23",
  url: "https://example.com/1",
  source: "forem",
};

describe("DashboardPage integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseHomePageState.mockReturnValue({
      user: {
        id: 1,
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
        role: "user",
      },
      isPageReady: true,
      settings: { defaultSearchMode: "OR" },
      jobs: [sampleJob],
      isSearching: false,
      isLoadingMore: false,
      hasMoreResults: false,
      searchSessionId: 1,
      hasSearched: true,
      lastSearchQuery: sampleQuery,
      executeSearch: vi.fn(),
      loadMore: vi.fn(),
      history: [{ id: "h1", state: sampleQuery, createdAt: "2026-02-23T10:00:00.000Z" }],
      clearHistory: vi.fn(),
      isHistoryLoaded: true,
      selectedJobs: [sampleJob],
      selectedJobIds: new Set(["1"]),
      toggleSelection: vi.fn(),
      resetSelection: vi.fn(),
      isExportDialogOpen: false,
      setIsExportDialogOpen: vi.fn(),
      exportTarget: "all",
      selectedExportColumns: ["title"],
      openExportDialog: vi.fn(),
      selectAllColumns: vi.fn(),
      toggleColumn: vi.fn(),
      applyExport: vi.fn(),
      addApplication: vi.fn(),
      isApplied: vi.fn().mockReturnValue(false),
      areApplicationsLoaded: true,
      isApplicationAuth: true,
      selectedJob: null,
      isDetailsOpen: false,
      setIsDetailsOpen: vi.fn(),
      isAuthRequiredOpen: false,
      setIsAuthRequiredOpen: vi.fn(),
      urlQuery: null,
      handleSearch: vi.fn(),
      handleCopySearchLink: vi.fn(),
      requestAuthForApplications: vi.fn(),
      replayPendingApplications: vi.fn(),
      updateUrlFromQuery: vi.fn(),
      trackJobs: vi.fn(),
      openJobDetails: vi.fn(),
    });
  });

  it("executes search and resets selection when SearchEngine emits a query", async () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByText("trigger-search"));

    const { handleSearch } = mockUseHomePageState.mock.results[0].value as {
      handleSearch: ReturnType<typeof vi.fn>;
    };
    const { resetSelection } = mockUseHomePageState.mock.results[0].value as {
      resetSelection: ReturnType<typeof vi.fn>;
    };

    expect(handleSearch).toHaveBeenCalledWith(sampleQuery);

    const { executeSearch } = mockUseHomePageState.mock.results[0].value as {
      executeSearch: ReturnType<typeof vi.fn>;
    };
    expect(executeSearch).not.toHaveBeenCalled();
    expect(resetSelection).not.toHaveBeenCalled();
  });

  it("replays history with persistInHistory=false and resets selection", async () => {
    render(<DashboardPage />);

    await act(async () => {
      fireEvent.click(screen.getByText("open-history"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("replay-history"));
    });

    const { executeSearch } = mockUseHomePageState.mock.results[0].value as {
      executeSearch: ReturnType<typeof vi.fn>;
    };
    const { resetSelection } = mockUseHomePageState.mock.results[0].value as {
      resetSelection: ReturnType<typeof vi.fn>;
    };
    const { updateUrlFromQuery } = mockUseHomePageState.mock.results[0].value as {
      updateUrlFromQuery: ReturnType<typeof vi.fn>;
    };

    expect(resetSelection).toHaveBeenCalledTimes(1);
    expect(updateUrlFromQuery).toHaveBeenCalledWith(sampleQuery);
    expect(executeSearch).toHaveBeenCalledWith(sampleQuery, {
      persistInHistory: false,
    });
  });

  it("opens export dialog for all and selected targets", async () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByText("export-all"));
    fireEvent.click(screen.getByText("export-selected"));

    const { openExportDialog } = mockUseHomePageState.mock.results[0].value as {
      openExportDialog: ReturnType<typeof vi.fn>;
    };

    expect(openExportDialog).toHaveBeenNthCalledWith(1, "all");
    expect(openExportDialog).toHaveBeenNthCalledWith(2, "selected");
  });
});
