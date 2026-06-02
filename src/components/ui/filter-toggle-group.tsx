"use client";

import { ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface FilterToggleOption<T extends string> {
  value: T;
  label: string;
}

interface FilterToggleGroupProps<T extends string> {
  options: FilterToggleOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  renderIcon?: (option: FilterToggleOption<T>) => ReactNode;
  compact?: boolean;
}

const desktopColumnClassNames: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  7: "lg:grid-cols-7",
};

export function FilterToggleGroup<T extends string>({
  options,
  value,
  onValueChange,
  renderIcon,
  compact = false,
}: FilterToggleGroupProps<T>) {
  if (compact) {
    return (
      <ToggleGroup
        type="single"
        variant="outline"
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue) {
            onValueChange(nextValue as T);
          }
        }}
        className="flex flex-wrap gap-2"
        spacing={1}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} className="rounded-md">
            {renderIcon?.(option)}
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  }

  return (
    <>
      <ToggleGroup
        type="single"
        variant="outline"
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue) {
            onValueChange(nextValue as T);
          }
        }}
        className="grid w-full grid-cols-2 gap-2 lg:hidden"
      >
        {options.map((option, index) => {
          const isLastOddItem = options.length % 2 === 1 && index === options.length - 1;

          return (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              size="sm"
              aria-label={`Filtrer: ${option.label}`}
              className={cn(
                "w-full justify-center rounded-md border shadow-none data-[spacing=0]:rounded-md data-[spacing=0]:border data-[spacing=0]:first:rounded-md data-[spacing=0]:last:rounded-md",
                "data-[spacing=0]:data-[variant=outline]:border-l data-[spacing=0]:data-[variant=outline]:first:border-l",
                isLastOddItem && "col-span-2"
              )}
            >
              {renderIcon?.(option)}
              {option.label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      <ToggleGroup
        type="single"
        variant="outline"
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue) {
            onValueChange(nextValue as T);
          }
        }}
        className={cn(
          "hidden w-full lg:grid",
          desktopColumnClassNames[options.length] ?? "lg:grid-cols-2"
        )}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            size="sm"
            aria-label={`Filtrer: ${option.label}`}
            className="w-full justify-center"
          >
            {renderIcon?.(option)}
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </>
  );
}
