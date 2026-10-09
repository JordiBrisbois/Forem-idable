"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEARCH_GOAL_LABELS, SearchGoal } from "@/types/preferences";

interface CoachUserGoalDialogProps {
  open: boolean;
  userName: string;
  currentGoal: SearchGoal;
  onOpenChange: (open: boolean) => void;
  onConfirm: (goal: SearchGoal, reason?: string) => void;
}

const GOAL_OPTIONS: { value: SearchGoal; label: string }[] = [
  { value: "internship", label: SEARCH_GOAL_LABELS.internship },
  { value: "job", label: SEARCH_GOAL_LABELS.job },
];

export function CoachUserGoalDialog({
  open,
  userName,
  currentGoal,
  onOpenChange,
  onConfirm,
}: CoachUserGoalDialogProps) {
  const [goal, setGoal] = useState<SearchGoal>(currentGoal);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setGoal(currentGoal);
  }, [currentGoal]);

  const handleConfirm = () => {
    onConfirm(goal, reason.trim() || undefined);
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Objectif de {userName}</DialogTitle>
          <DialogDescription>
            Définir si cette personne recherche un stage ou un emploi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="goal-select">Objectif de recherche</Label>
            <Select value={goal} onValueChange={(v) => setGoal(v as SearchGoal)}>
              <SelectTrigger id="goal-select">
                <SelectValue placeholder="Sélectionner un objectif" />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-reason">Note (optionnel)</Label>
            <Input
              id="goal-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: changement de projet..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
