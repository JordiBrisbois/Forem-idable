"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { runtimeConfig } from "@/config/runtime";
import { useAuth } from "@/components/auth/AuthProvider";
import { loginUser, registerUser } from "@/lib/api/auth";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";
import { toast } from "sonner";

type AuthMode = "login" | "register";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: AuthMode;
  title?: string;
  description?: string;
  onSuccess?: () => Promise<void> | void;
}

export function AuthRequiredDialog({
  open,
  onOpenChange,
  mode: forcedMode,
  title,
  description,
  onSuccess,
}: AuthRequiredDialogProps) {
  const { refresh, setUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>(forcedMode ?? "login");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordDialogOpen, setIsForgotPasswordDialogOpen] = useState(false);

  const effectiveMode = forcedMode ?? mode;
  const effectiveTitle =
    title ??
    (effectiveMode === "login" ? "Connexion" : "Créer un compte");
  const effectiveDescription =
    description ??
    (effectiveMode === "login"
      ? "Connectez-vous pour suivre vos candidatures et retrouver votre historique."
      : "Créez un compte pour suivre vos candidatures et retrouver votre historique.");

  const submit = async () => {
    if (effectiveMode === "register" && password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } =
        effectiveMode === "login"
          ? await loginUser({ email, password })
          : await registerUser({ email, password, firstName, lastName });

      if (!data.user) {
        toast.error("Action impossible.");
        return;
      }

      setUser(data.user);
      await refresh();
      await onSuccess?.();
      toast.success(
        effectiveMode === "login" ? "Connexion réussie." : "Compte créé."
      );
      onOpenChange(false);
      setEmail("");
      setFirstName("");
      setLastName("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Action impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{effectiveTitle}</DialogTitle>
          <DialogDescription>{effectiveDescription}</DialogDescription>
        </DialogHeader>

        {!forcedMode ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "login" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("login")}
            >
              Connexion
            </Button>
            <Button
              type="button"
              variant={mode === "register" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("register")}
            >
              Créer un compte
            </Button>
          </div>
        ) : null}

        <div className="space-y-3">
          {effectiveMode === "register" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                id="auth-required-first-name"
                name="given-name"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Prénom"
              />
              <Input
                id="auth-required-last-name"
                name="family-name"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Nom"
              />
            </div>
          ) : null}
          <Input
            id="auth-required-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="vous@example.com"
          />
          <Input
            id={effectiveMode === "login" ? "auth-required-current-password" : "auth-required-new-password"}
            name={effectiveMode === "login" ? "current-password" : "new-password"}
            type="password"
            autoComplete={effectiveMode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mot de passe (8 caractères minimum)"
          />
          {effectiveMode === "login" && runtimeConfig.auth.passwordResetEnabled ? (
            <Button
              type="button"
              variant="link"
              className="h-auto justify-start px-0 text-sm"
              onClick={() => setIsForgotPasswordDialogOpen(true)}
            >
              Mot de passe oublié ?
            </Button>
          ) : null}
          {effectiveMode === "register" ? (
            <Input
              id="auth-required-confirm-password"
              name="new-password-confirmation"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirmer le mot de passe"
            />
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={
              isSubmitting ||
              !email.trim() ||
              password.length < 8 ||
              (effectiveMode === "register" &&
                (!firstName.trim() ||
                  !lastName.trim() ||
                  confirmPassword.length < 8 ||
                  password !== confirmPassword))
            }
          >
            {effectiveMode === "login" ? "Se connecter" : "Créer un compte"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <ForgotPasswordDialog
        open={isForgotPasswordDialogOpen}
        onOpenChange={setIsForgotPasswordDialogOpen}
      />
    </Dialog>
  );
}
