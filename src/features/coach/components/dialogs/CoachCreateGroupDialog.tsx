"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface CoachCreateGroupDialogProps {
  open: boolean;
  groupName: string;
  onOpenChange: (open: boolean) => void;
  onGroupNameChange: (value: string) => void;
  onCreateGroup: () => void;
}

export function CoachCreateGroupDialog({
  open,
  groupName,
  onOpenChange,
  onGroupNameChange,
  onCreateGroup,
}: CoachCreateGroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un groupe</DialogTitle>
          <DialogDescription>
            Les admins verront toujours le groupe. Un coach créateur y sera attribué automatiquement.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="coach-group-name">Nom du groupe</FieldLabel>
            <Input
              id="coach-group-name"
              value={groupName}
              onChange={(event) => onGroupNameChange(event.target.value)}
              placeholder="Nom du groupe"
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={onCreateGroup} disabled={!groupName.trim()}>
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
