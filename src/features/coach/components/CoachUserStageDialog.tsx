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
import {
  BENEFICIARY_STAGE_LABELS,
  BENEFICIARY_STAGE_ORDER,
  BeneficiaryStage,
} from "@/types/beneficiaryStage";

interface CoachUserStageDialogProps {
  open: boolean;
  userName: string;
  currentStage: BeneficiaryStage;
  onOpenChange: (open: boolean) => void;
  onConfirm: (stage: BeneficiaryStage, reason?: string) => void;
}

export function CoachUserStageDialog({
  open,
  userName,
  currentStage,
  onOpenChange,
  onConfirm,
}: CoachUserStageDialogProps) {
  const [stage, setStage] = useState<BeneficiaryStage>(currentStage);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setStage(currentStage);
  }, [currentStage]);

  const handleConfirm = () => {
    onConfirm(stage, reason.trim() || undefined);
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Étape du parcours de {userName}</DialogTitle>
          <DialogDescription>
            Où en est cette personne dans l&apos;année (recherche de stage, en
            stage, recherche d&apos;emploi, en emploi). L&apos;objectif de
            recherche est ajusté automatiquement.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="stage-select">Étape</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as BeneficiaryStage)}>
              <SelectTrigger id="stage-select">
                <SelectValue placeholder="Sélectionner une étape" />
              </SelectTrigger>
              <SelectContent>
                {BENEFICIARY_STAGE_ORDER.map((value) => (
                  <SelectItem key={value} value={value}>
                    {BENEFICIARY_STAGE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage-reason">Note (optionnel)</Label>
            <Input
              id="stage-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: stage trouvé chez ACME"
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
