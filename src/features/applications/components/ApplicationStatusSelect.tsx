"use client";

import { ComponentProps } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPLICATION_STATUS_OPTIONS } from "@/features/applications/utils";
import { cn } from "@/lib/utils";
import { ApplicationStatus } from "@/types/application";

const STATUS_OPTIONS = APPLICATION_STATUS_OPTIONS;

interface ApplicationStatusSelectProps {
  value: ApplicationStatus;
  onValueChange: (value: ApplicationStatus) => void;
  placeholder?: string;
  triggerId?: string;
  triggerClassName?: string;
  onTriggerClick?: ComponentProps<typeof SelectTrigger>["onClick"];
}

export function ApplicationStatusSelect({
  value,
  onValueChange,
  placeholder = "Choisir un statut",
  triggerId,
  triggerClassName,
  onTriggerClick,
}: ApplicationStatusSelectProps) {
  return (
    <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as ApplicationStatus)}>
      <SelectTrigger
        id={triggerId}
        className={cn("w-full", triggerClassName)}
        onClick={onTriggerClick}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
