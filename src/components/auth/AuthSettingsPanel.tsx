"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth/AuthProvider";
import { logoutUser } from "@/lib/api/auth";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function AuthSettingsPanel() {
  const { user, isLoading, refresh, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (mode: "login" | "register") => {
    if (mode === "register" && password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload =
        mode === "login"
          ? { email, password }
          : { email, password, firstName, lastName };

      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        error?: string;
        user?: {
          id: number;
          email: string;
          firstName: string;
          lastName: string;
          role: "user" | "coach" | "admin";
        };
      };

      if (!response.ok || !data.user) {
        toast.error(data.error || "Action impossible.");
        return;
      }

      setUser(data.user);
      toast.success(
        mode === "login"
          ? "Connecté. Synchronisation en cours."
          : "Compte créé. Synchronisation en cours."
      );

      await refresh();
      window.location.reload();
    } catch {
      toast.error("Action impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);

    try {
      await logoutUser();
      setUser(null);
      await refresh();
      toast.success("Déconnecté.");
      window.location.reload();
    } catch {
      toast.error("Déconnexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Compte</h2>
      <Separator />

      {user ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connecté en tant que{" "}
            <span className="font-semibold text-foreground">
              {`${user.firstName} ${user.lastName}`.trim()}
            </span>{" "}
            <span className="text-xs">({user.email})</span>.
            Vos candidatures et votre historique de recherche sont liés à votre compte.
          </p>
          <Badge variant="secondary" className="w-fit capitalize">
            {user.role}
          </Badge>
          <Button type="button" variant="outline" onClick={handleLogout} disabled={isSubmitting || isLoading}>
            Se déconnecter
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Créez un compte ou connectez-vous pour suivre vos candidatures et conserver votre historique de recherche.
          </p>
          <div className="space-y-2">
            <Label htmlFor="auth-first-name">Prénom</Label>
            <Input
              id="auth-first-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Prénom"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-last-name">Nom</Label>
            <Input
              id="auth-last-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Nom"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-email">Adresse email</Label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">Mot de passe</Label>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="8 caractères minimum"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password-confirm">Confirmer le mot de passe</Label>
            <Input
              id="auth-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Ressaisir le mot de passe"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void handleAuth("login")}
              disabled={isSubmitting || !email.trim() || password.length < 8}
            >
              Se connecter
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleAuth("register")}
              disabled={
                isSubmitting ||
                !email.trim() ||
                !firstName.trim() ||
                !lastName.trim() ||
                password.length < 8 ||
                confirmPassword.length < 8 ||
                password !== confirmPassword
              }
            >
              Créer un compte
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
