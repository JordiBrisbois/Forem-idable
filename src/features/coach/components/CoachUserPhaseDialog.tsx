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
import { TrackingPhase } from "@/types/coach";

interface CoachUserPhaseDialogProps {
  open: boolean;
  userName: string;
  currentPhase: TrackingPhase;
  onOpenChange: (open: boolean) => void;
  onConfirm: (phase: TrackingPhase, reason?: string) => void;
}

const PHASE_OPTIONS: { value: TrackingPhase; label: string }[] = [
  { value: "internship_search", label: "Recherche stage" },
  { value: "job_search", label: "Recherche emploi" },
  { value: "placed", label: "En emploi" },
  { value: "dropped", label: "Sortie du dispositif" },
];

export function CoachUserPhaseDialog({
  open,
  userName,
  currentPhase,
  onOpenChange,
  onConfirm,
}: CoachUserPhaseDialogProps) {
  const [phase, setPhase] = useState<TrackingPhase>(currentPhase);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setPhase(currentPhase);
  }, [currentPhase]);

  const handleConfirm = () => {
    onConfirm(phase, reason.trim() || undefined);
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Changer la phase de {userName}</DialogTitle>
          <DialogDescription>
            Modifier la phase de suivi pour ce bénéficiaire.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="phase-select">Nouvelle phase</Label>
            <Select value={phase} onValueChange={(v) => setPhase(v as TrackingPhase)}>
              <SelectTrigger id="phase-select">
                <SelectValue placeholder="Sélectionner une phase" />
              </SelectTrigger>
              <SelectContent>
                {PHASE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phase-reason">Raison (optionnel)</Label>
            <Input
              id="phase-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: fin de formation, embauche..."
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
