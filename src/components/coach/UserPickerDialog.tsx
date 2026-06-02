"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/auth";

interface PickerUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface UserPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  users: PickerUser[];
  onSelect: (user: PickerUser) => void;
}

export function UserPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  users,
  onSelect,
}: UserPickerDialogProps) {
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) =>
      [user.firstName, user.lastName, `${user.firstName} ${user.lastName}`.trim(), user.email]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [query, users]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setQuery("");
        }
      }}
      title={title}
      description={description}
      className="sm:max-w-xl"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Rechercher un utilisateur..."
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            Aucun utilisateur correspondant.
          </div>
        </CommandEmpty>
        <CommandGroup heading="Utilisateurs">
          {filteredUsers.map((user) => (
            <CommandItem
              key={user.id}
              value={`${user.firstName}-${user.lastName}-${user.email}-${user.role}`}
              onSelect={() => {
                onSelect(user);
                onOpenChange(false);
                setQuery("");
              }}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
