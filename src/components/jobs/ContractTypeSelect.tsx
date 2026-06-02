"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTRACT_TYPES, normalizeContractType, type ContractType } from "@/lib/contractType";

interface ContractTypeSelectProps {
  value: string;
  onValueChange: (value: ContractType) => void;
  placeholder?: string;
  id?: string;
}

export function ContractTypeSelect({
  value,
  onValueChange,
  placeholder = "Type de contrat",
  id,
}: ContractTypeSelectProps) {
  const normalized = normalizeContractType(value);

  return (
    <Select value={normalized} onValueChange={onValueChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {CONTRACT_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {type === "CONTRAT_PRO" ? "Contrat pro" : type.charAt(0) + type.slice(1).toLowerCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
