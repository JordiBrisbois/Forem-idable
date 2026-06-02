"use client";

import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface CoachFilterBarProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  label?: string;
  compact?: boolean;
}

export function CoachFilterBar<T extends string>({
  options,
  value,
  onValueChange,
  label = "Filtrer",
  compact = false,
}: CoachFilterBarProps<T>) {
  // Few options -> inline toggle group (compact or full)
  if (options.length <= 3) {
    if (compact) {
      return (
        <ToggleGroup
          type="single"
          variant="outline"
          value={value}
          onValueChange={(next) => {
            if (next) onValueChange(next as T);
          }}
          className="flex flex-wrap gap-2"
          spacing={1}
        >
          {options.map((opt) => (
            <ToggleGroupItem key={opt.value} value={opt.value} className="rounded-md">
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      );
    }

    return (
      <ToggleGroup
        type="single"
        variant="outline"
        value={value}
        onValueChange={(next) => {
          if (next) onValueChange(next as T);
        }}
        className="grid w-full grid-cols-2 gap-2 lg:hidden"
      >
        {options.map((opt, index) => {
          const isLastOdd = options.length % 2 === 1 && index === options.length - 1;
          return (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              size="sm"
              className={cn(
                "w-full justify-center rounded-md border shadow-none",
                isLastOdd && "col-span-2"
              )}
            >
              {opt.label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    );
  }

  // Many options -> Select + Popover
  const activeLabel = options.find((o) => o.value === value)?.label ?? label;

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(v) => onValueChange(v as T)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(value !== options[0]?.value && "border-primary text-primary")}
          >
            <Filter className="mr-1.5 h-4 w-4" />
            {activeLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="end">
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <ToggleGroup
              type="single"
              variant="outline"
              value={value}
              onValueChange={(v) => {
                if (v) onValueChange(v as T);
              }}
              className="flex flex-col gap-1.5"
            >
              {options.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className="w-full justify-start"
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CoachFilterChips<T extends string>({
  options,
  value,
  onValueChange,
}: {
  options: Array<{ value: T; label: string; variant?: "default" | "destructive" | "warning" }>;
  value: T;
  onValueChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {options.map((chip) => {
        const isActive = value === chip.value;
        const variant = chip.variant ?? "default";
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onValueChange(chip.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              isActive && variant === "default" && "border-primary bg-primary text-primary-foreground",
              isActive && variant === "destructive" && "border-destructive bg-destructive text-white",
              isActive && variant === "warning" && "border-[#F2C27A] bg-[#FFF5E8] text-[#A46110] dark:border-[#6D4B1E] dark:bg-[#2A1D0F] dark:text-[#F2C27A]",
              !isActive && "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
