"use client";

import * as React from "react";
import { Check, ChevronDown, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES_ORDER, locationCache, LocationEntry, LocationCategory } from "@/services/location/locationCache";

export function LocationAutocomplete({
    values,
    onChange,
}: {
    values: LocationEntry[];
    onChange: (values: LocationEntry[]) => void;
}) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [locations, setLocations] = React.useState<LocationEntry[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const deferredSearch = React.useDeferredValue(searchQuery);
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    const selectedIds = React.useMemo(() => new Set(values.map(v => v.id)), [values]);

    React.useEffect(() => {
        let mounted = true;
        const load = async () => {
            setIsLoading(true);
            const data = await locationCache.getHierarchy();
            if (mounted) {
                setLocations(data);
                setIsLoading(false);
            }
        };

        void load();
        return () => {
            mounted = false;
        };
    }, []);

    const groupedLocations = React.useMemo(() => {
        const groups = new Map<LocationCategory, LocationEntry[]>();
        for (const category of CATEGORIES_ORDER) {
            groups.set(category, []);
        }

        for (const item of locations) {
            if (normalizedSearch && !item.name.toLowerCase().includes(normalizedSearch)) continue;
            const list = groups.get(item.type);
            if (list) list.push(item);
        }

        return groups;
    }, [locations, normalizedSearch]);

    const toggleLocation = React.useCallback((entry: LocationEntry) => {
        const exists = values.some(v => v.id === entry.id);
        if (exists) {
            onChange(values.filter(v => v.id !== entry.id));
        } else {
            onChange([...values, entry]);
        }
    }, [values, onChange]);

    const previewText = values.length === 0
        ? "Ajouter un lieu de travail"
        : values.length === 1
            ? values[0].name
            : `${values.length} lieux sélectionnés`;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-12 px-4 rounded-full bg-transparent border border-border focus:ring-2 focus:ring-primary/20 hover:bg-muted/20 text-left font-normal"
                >
                    <div className="flex items-center gap-2 overflow-hidden text-muted-foreground w-full">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate flex-1">{previewText}</span>
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[95vw] p-0 rounded-xl"
              align="start"
            >
                {/* We disable cmDK internal filtering so we can handle display ourselves, but keep keyboard nav */}
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Filtrer un lieu (ex: Verviers, Liège...)"
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    {values.length > 0 && (
                        <div className="px-2 py-2 border-b bg-muted/20">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {values.length} sélection{values.length > 1 ? "s" : ""}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="xs"
                                    className="h-6 rounded-full px-2 text-xs"
                                    onClick={() => onChange([])}
                                >
                                    Tout effacer
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1 max-h-16 overflow-auto">
                                {values.map((entry) => (
                                    <Badge key={entry.id} variant="secondary" className="gap-1 rounded-full border border-border/60 bg-background/80">
                                        <span className="max-w-[160px] truncate">{entry.name}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            className="ml-0.5 rounded-full"
                                            onClick={() => toggleLocation(entry)}
                                            aria-label={`Retirer ${entry.name}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    <CommandList className="max-h-[350px] overflow-y-auto custom-scrollbar">
                        {isLoading && <CommandEmpty>Chargement des localisations...</CommandEmpty>}
                        {CATEGORIES_ORDER.map((category) => (
                            <LocationCategoryGroup
                                key={category}
                                category={category}
                                items={groupedLocations.get(category) || []}
                                selectedIds={selectedIds}
                                searchQuery={normalizedSearch}
                                onToggle={toggleLocation}
                            />
                        ))}
                        {!isLoading && normalizedSearch && Array.from(groupedLocations.values()).every(items => items.length === 0) && (
                            <CommandEmpty>Aucun lieu trouvé.</CommandEmpty>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function LocationCategoryGroup({
    category,
    items,
    selectedIds,
    searchQuery,
    onToggle,
}: {
    category: LocationCategory;
    items: LocationEntry[];
    selectedIds: Set<string>;
    searchQuery: string;
    onToggle: (entry: LocationEntry) => void;
}) {
    const isSearching = searchQuery.trim().length > 0;
    // Render cap to keep the dropdown snappy when no filter is typed.
    const renderLimit = category === "Localités" || category === "Communes" ? 120 : 200;
    const filteredItems = isSearching ? items : items.slice(0, renderLimit);

    // We keep the collapsible open automatically if there's a search, or if the category is "Localités" (by default open)
    const isDefaultOpen = category === "Localités";
    const [isOpen, setIsOpen] = React.useState(isDefaultOpen);

    React.useEffect(() => {
        if (isSearching) {
            setIsOpen(true);
        } else {
            setIsOpen(isDefaultOpen);
        }
    }, [isSearching, isDefaultOpen]);

    if (filteredItems.length === 0) return null;

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="border-b last:border-b-0"
        >
            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium hover:bg-muted text-foreground transition-colors group">
                {category}
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-1 pb-1">
                {filteredItems.map((loc) => (
                    <CommandItem
                        key={loc.id}
                        value={loc.name}
                        onSelect={() => onToggle(loc)}
                        className="rounded-md pl-6 cursor-pointer"
                    >
                        <Check
                            className={cn(
                                "mr-2 h-4 w-4 text-primary",
                                selectedIds.has(loc.id) ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {loc.name}
                    </CommandItem>
                ))}
                {!isSearching && items.length > renderLimit && (
                    <p className="px-6 py-2 text-xs text-muted-foreground">
                        {items.length - renderLimit} éléments masqués. Tapez pour filtrer.
                    </p>
                )}
            </CollapsibleContent>
        </Collapsible>
    );
}
