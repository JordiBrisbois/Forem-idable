"use client";

import { useState } from "react";
import Link from "next/link";
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
import { runtimeConfig } from "@/config/runtime";
import { requestPasswordReset } from "@/lib/api/auth";
import { toast } from "sonner";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!runtimeConfig.auth.passwordResetEnabled) {
    return null;
  }

  const submit = async () => {
    setIsSubmitting(true);

    try {
      const { data } = await requestPasswordReset(email);

      toast.success(
        data.message ||
          "Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé."
      );
    } catch {
      toast.error("Envoi impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mot de passe oublié</DialogTitle>
          <DialogDescription>
            Entrez votre adresse email pour recevoir un lien de réinitialisation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            id="forgot-password-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="vous@example.com"
          />
          <p className="text-xs text-muted-foreground">
            Le lien de réinitialisation expire après 60 minutes.
            {" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Confidentialité
            </Link>
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={isSubmitting || !email.trim()}
          >
            Envoyer le lien
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
