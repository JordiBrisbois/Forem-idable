"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { runtimeConfig } from "@/config/runtime";
import { resetPassword } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!runtimeConfig.auth.passwordResetEnabled) {
    return (
      <div className="mx-auto max-w-2xl animate-in space-y-6 fade-in duration-500">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Réinitialisation indisponible</h1>
          <p className="text-lg text-muted-foreground">
            Cette fonctionnalité n’est pas activée sur cette instance.
          </p>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!token) {
      toast.error("Lien invalide ou incomplet.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(token, password);

      setIsSuccess(true);
      setPassword("");
      setConfirmPassword("");
      toast.success("Mot de passe mis à jour.");
    } catch {
      toast.error("Réinitialisation impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl animate-in space-y-6 fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Choisir un nouveau mot de passe</h1>
        <p className="text-lg text-muted-foreground">
          Définissez un nouveau mot de passe pour votre compte {runtimeConfig.app.name}.
        </p>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
        {isSuccess ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Votre mot de passe a été mis à jour. Vous pouvez maintenant vous reconnecter.
            </p>
            <Button asChild>
              <Link href="/account">Aller vers Mon compte</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="reset-password">
                Nouveau mot de passe
              </label>
              <Input
                id="reset-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8 caractères minimum"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="reset-password-confirm">
                Confirmer le mot de passe
              </label>
              <Input
                id="reset-password-confirm"
                name="new-password-confirmation"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirmer le mot de passe"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void submit()}
                disabled={
                  isSubmitting ||
                  !token ||
                  password.length < 8 ||
                  confirmPassword.length < 8 ||
                  password !== confirmPassword
                }
              >
                Mettre à jour le mot de passe
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
