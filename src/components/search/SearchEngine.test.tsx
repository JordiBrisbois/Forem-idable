import { fireEvent, render, screen } from "@testing-library/react";
import { SearchEngine } from "./SearchEngine";

vi.mock("./LocationAutocomplete", () => ({
  LocationAutocomplete: ({ values }: { values: Array<{ name: string }> }) => (
    <div>
      location-autocomplete
      {values.map((value) => (
        <span key={value.name}>{value.name}</span>
      ))}
    </div>
  ),
}));

describe("SearchEngine", () => {
  it("converts a trailing space into a keyword tag from input change events", () => {
    const onSearch = vi.fn();

    render(<SearchEngine onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Ex: Développeur, Comptable...");
    fireEvent.change(input, { target: { value: "developpeur " } });

    expect(screen.getByText("developpeur")).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("keeps the last unfinished fragment in the input while committing previous keywords", () => {
    const onSearch = vi.fn();

    render(<SearchEngine onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Ex: Développeur, Comptable...");
    fireEvent.change(input, { target: { value: "developpeur compt" } });

    expect(screen.getByText("developpeur")).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe("compt");
  });

  it("opens history without committing the pending input value", () => {
    const onSearch = vi.fn();
    const onOpenHistory = vi.fn();

    render(<SearchEngine onSearch={onSearch} historyCount={3} onOpenHistory={onOpenHistory} />);

    const input = screen.getByPlaceholderText("Ex: Développeur, Comptable...");
    fireEvent.change(input, { target: { value: "developpeur" } });

    const historyButton = screen.getByRole("button", { name: "Ouvrir l'historique (3)" });
    fireEvent.pointerDown(historyButton);
    fireEvent.click(historyButton);

    expect(onOpenHistory).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("developpeur")).not.toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe("developpeur");
  });

  it("reinitializes the form when remounted with a different search state", () => {
    const onSearch = vi.fn();

    const { rerender } = render(
      <SearchEngine
        key="search-dev"
        onSearch={onSearch}
        initialState={{
          keywords: ["dev"],
          locations: [{ id: "loc1", name: "4000 Liege", type: "Localités" }],
          booleanMode: "OR",
        }}
      />
    );

    expect(screen.getByText("dev")).toBeInTheDocument();
    expect(screen.getByText("4000 Liege")).toBeInTheDocument();

    rerender(
      <SearchEngine
        key="search-designer"
        onSearch={onSearch}
        initialState={{
          keywords: ["designer", "ux"],
          locations: [{ id: "loc2", name: "Bruxelles", type: "Localités" }],
          booleanMode: "AND",
        }}
      />
    );

    expect(screen.queryByText("dev")).not.toBeInTheDocument();
    expect(screen.getByText("designer")).toBeInTheDocument();
    expect(screen.getByText("ux")).toBeInTheDocument();
    expect(screen.queryByText("4000 Liege")).not.toBeInTheDocument();
    expect(screen.getByText("Bruxelles")).toBeInTheDocument();
  });
});
