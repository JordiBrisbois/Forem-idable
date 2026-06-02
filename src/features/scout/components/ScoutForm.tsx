"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { SCOUT_CATEGORIES } from "@/lib/server/scoutOverpass";
import { ScoutJobCreateInput } from "../scoutSchemas";

const ALL_CATEGORIES = Object.entries(SCOUT_CATEGORIES).map(([key, label]) => ({ key, label }));

interface ScoutFormProps {
  onSubmit: (input: ScoutJobCreateInput) => void;
  isLoading: boolean;
}

interface CitySuggestion {
  name: string;
  full: string;
}

export function ScoutForm({ onSubmit, isLoading }: ScoutFormProps) {
  const [query, setQuery] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [radius, setRadius] = useState([5000]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [scrapeEmails, setScrapeEmails] = useState(false);
  const [selectAll, setSelectAll] = useState(true);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedCategories(new Set(ALL_CATEGORIES.map((c) => c.key)));
    } else {
      setSelectedCategories(new Set());
    }
  };

  useEffect(() => {
    if (!query || query.length < 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCitySuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/scout/autocomplete?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data: { suggestions?: CitySuggestion[] }) => {
          const list = data.suggestions ?? [];
          setCitySuggestions(list);
          setShowSuggestions(list.length > 0);
        })
        .catch(() => {
          setCitySuggestions([]);
          setShowSuggestions(false);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCity = (name: string) => {
    setQuery(name);
    setShowSuggestions(false);
    setCitySuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const categories = selectAll ? undefined : Array.from(selectedCategories);
    onSubmit({ query, radius: radius[0], categories, scrapeEmails });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="text-primary" />
          Nouvelle recherche
        </CardTitle>
        <CardDescription>
          Découvrez des entreprises autour d&apos;une ville via OpenStreetMap.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* City Input with Autocomplete */}
          <div className="flex flex-col gap-2 relative" ref={suggestionsRef}>
            <Label htmlFor="scout-query" className="text-sm">Ville</Label>
            <div className="relative">
              <Input
                id="scout-query"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.length >= 3) setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (query.length >= 3 && citySuggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Ex: Liège, Bruxelles, Namur..."
                autoComplete="off"
                required
                className="pr-10"
              />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            {showSuggestions && citySuggestions.length > 0 && (
              <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-lg">
                <ul className="max-h-56 overflow-auto py-1">
                  {citySuggestions.map((s) => (
                    <li
                      key={s.name + s.full}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleSelectCity(s.name)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{s.full}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Radius Slider */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm">
              Rayon :{" "}
              <span className="font-medium text-primary">
                {radius[0] >= 1000 ? `${(radius[0] / 1000).toFixed(1)} km` : `${radius[0]} m`}
              </span>
            </Label>
            <div className="relative">
              <input
                type="range"
                min={500}
                max={20000}
                step={500}
                value={radius[0]}
                onChange={(e) => setRadius([Number(e.target.value)])}
                className="w-full accent-primary h-2 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>500m</span>
                <span>10km</span>
                <span>20km</span>
              </div>
            </div>
          </div>

          {/* Email Scraping Toggle */}
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
            <Checkbox
              id="scout-scrape"
              checked={scrapeEmails}
              onCheckedChange={(checked) => setScrapeEmails(checked === true)}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-0.5 leading-snug">
              <span className="text-sm font-medium">Scraper les emails</span>
              <span className="text-xs text-muted-foreground">
                Visite chaque site web pour trouver des emails (plus lent, respecte le rate limiting).
              </span>
            </div>
          </label>

          {/* Categories Section */}
          <div className="space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
              <Checkbox
                id="scout-all-cats"
                checked={selectAll}
                onCheckedChange={(checked) => handleSelectAll(checked === true)}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-0.5 leading-snug">
                <span className="text-sm font-medium">Tous les secteurs</span>
                <span className="text-xs text-muted-foreground">
                  Sinon, sélectionnez les catégories ci-dessous.
                </span>
              </div>
            </label>

            {/* Mobile: Accordion style / Desktop: Grid */}
            {!selectAll && (
              <>
                {/* Mobile Expand Toggle */}
                <div className="lg:hidden">
                  <button
                    type="button"
                    onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                    className="flex w-full items-center justify-between rounded-lg border p-3 text-sm text-muted-foreground hover:bg-muted/50"
                  >
                    <span>Sélectionner des catégories ({selectedCategories.size} sélectionnées)</span>
                    {categoriesExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {categoriesExpanded && (
                    <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto rounded-lg border p-3 bg-popover">
                      {ALL_CATEGORIES.map(({ key, label }) => (
                        <label
                          key={key}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                            selectedCategories.has(key)
                              ? "bg-primary/5 text-primary"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <Checkbox
                            checked={selectedCategories.has(key)}
                            onCheckedChange={() => toggleCategory(key)}
                          />
                          <span className="truncate">{label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop: Grid Layout */}
                <div className="hidden lg:grid grid-cols-2 gap-2">
                  {ALL_CATEGORIES.map(({ key, label }) => (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        selectedCategories.has(key)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedCategories.has(key)}
                        onCheckedChange={() => toggleCategory(key)}
                      />
                      <span className="truncate">{label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          <Separator className="my-2" />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full sm:w-auto self-start"
          >
            <Search className="mr-2 h-4 w-4" />
            {isLoading ? (
              <>
                <span className="animate-pulse">Lancement...</span>
              </>
            ) : (
              "Lancer la recherche"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
