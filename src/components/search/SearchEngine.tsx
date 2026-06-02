"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationAutocomplete } from "./LocationAutocomplete";
import { KeywordComposer, BooleanModeToggle } from "./KeywordComposer";
import { SearchHints } from "./SearchHints";
import { useKeywordParser } from "./useKeywordParser";
import { LocationEntry } from "@/services/location/locationCache";
import { BooleanMode, SearchQuery } from "@/types/search";
import { FeaturedSearch } from "@/types/featuredSearch";

export type SearchState = SearchQuery;

interface SearchEngineProps {
  onSearch: (state: SearchState) => void;
  initialState?: Partial<SearchState>;
  featuredSearches?: FeaturedSearch[];
  onRunFeaturedSearch?: (item: FeaturedSearch) => void;
  historyCount?: number;
  onOpenHistory?: () => void;
}

export function SearchEngine({
  onSearch,
  initialState,
  featuredSearches = [],
  onRunFeaturedSearch,
  historyCount = 0,
  onOpenHistory,
}: SearchEngineProps) {
  const {
    keywords,
    inputValue,
    handleInputValueChange,
    handleKeyDown,
    addKeyword,
    removeKeyword,
    flushPendingInput,
  } = useKeywordParser(initialState?.keywords);

  const [selectedLocations, setSelectedLocations] = useState<LocationEntry[]>(
    initialState?.locations || []
  );
  const [booleanMode, setBooleanMode] = useState<BooleanMode>(
    initialState?.booleanMode || "OR"
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLocationsLabel =
    selectedLocations.length > 0
      ? `${selectedLocations.length} lieu${selectedLocations.length > 1 ? "x" : ""}`
      : null;

  const triggerSearch = () => {
    const finalKeywords = flushPendingInput();
    onSearch({ keywords: finalKeywords, locations: selectedLocations, booleanMode });
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:shadow-md lg:p-6">
      <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1fr)_240px_auto] lg:items-center">
        <KeywordComposer
          keywords={keywords}
          inputValue={inputValue}
          inputRef={inputRef}
          historyCount={historyCount}
          onInputValueChange={handleInputValueChange}
          onInputKeyDown={handleKeyDown}
          onInputBlur={() => {
            if (inputValue.trim()) {
              addKeyword(inputValue);
            }
          }}
          onRemoveKeyword={removeKeyword}
          onOpenHistory={onOpenHistory}
        />

        <div className="w-full shrink-0">
          <LocationAutocomplete values={selectedLocations} onChange={setSelectedLocations} />
        </div>

        <Button
          onClick={triggerSearch}
          className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-primary-foreground shadow-sm hover:bg-primary/90 lg:w-auto"
        >
          <Search className="h-5 w-5 shrink-0" />
          <span>Rechercher</span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <BooleanModeToggle
          booleanMode={booleanMode}
          onToggle={() => setBooleanMode((prev) => (prev === "OR" ? "AND" : "OR"))}
        />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">OU</span> = au moins un mot-clé ·{" "}
          <span className="font-medium text-foreground">ET</span> = tous les mots-clés
        </p>
      </div>

      <SearchHints
        selectedLocationsLabel={selectedLocationsLabel}
        featuredSearches={featuredSearches}
        onRunFeaturedSearch={onRunFeaturedSearch}
      />
    </div>
  );
}

