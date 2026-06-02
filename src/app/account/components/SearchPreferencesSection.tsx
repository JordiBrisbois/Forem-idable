import { memo } from "react";
import { Search } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AccountSectionHeader } from "./AccountSectionHeader";

type SearchPreferencesSectionProps = {
  value: "AND" | "OR";
  onChange: (value: "AND" | "OR") => void;
};

function SearchPreferencesSectionComponent({
  value,
  onChange,
}: SearchPreferencesSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <AccountSectionHeader
        icon={Search}
        title="Recherche"
        description="Mode par défaut pour vos nouvelles recherches."
      />
      <ToggleGroup
        type="single"
        variant="outline"
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue === "AND" || nextValue === "OR") {
            onChange(nextValue);
          }
        }}
        className="flex w-full max-w-md flex-wrap"
      >
        <ToggleGroupItem value="OR" className="flex-1">
          OU
        </ToggleGroupItem>
        <ToggleGroupItem value="AND" className="flex-1">
          ET
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">OU</span> élargit les résultats,{" "}
        <span className="font-medium text-foreground">ET</span> les rend plus précis.
      </p>
    </section>
  );
}

export const SearchPreferencesSection = memo(SearchPreferencesSectionComponent);
