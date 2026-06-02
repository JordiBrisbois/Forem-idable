"use client";

import { useState } from "react";
import { ChevronsUpDown, LogIn, LogOut, UserPlus, UserRound } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAuth } from "@/components/auth/AuthProvider";
import { logoutUser } from "@/lib/api/auth";
import { runtimeConfig } from "@/config/runtime";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";
import { toast } from "sonner";

type AuthMode = "login" | "register";

function getDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function getUserInitials(firstName: string, lastName: string, email: string) {
  const fullName = getDisplayName(firstName, lastName);
  if (fullName) {
    return fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((value) => value[0]?.toUpperCase() ?? "")
      .join("");
  }

  return email.slice(0, 2).toUpperCase();
}

function getRoleLabel(role: "user" | "coach" | "admin") {
  switch (role) {
    case "admin":
      return "Admin";
    case "coach":
      return "Coach";
    default:
      return "Utilisateur";
  }
}

export function AuthSidebarPanel() {
  const { user, isLoading, refresh, setUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordDialogOpen, setIsForgotPasswordDialogOpen] = useState(false);

  const openDialog = (nextMode: AuthMode) => {
    setMode(nextMode);
    if (nextMode === "login") {
      setFirstName("");
      setLastName("");
      setConfirmPassword("");
    }
    setIsOpen(true);
  };

  const handleAuth = async () => {
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
      await refresh();
      toast.success(mode === "login" ? "Connexion réussie." : "Compte créé.");
      setIsOpen(false);
      setEmail("");
      setFirstName("");
      setLastName("");
      setPassword("");
      setConfirmPassword("");
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
    <>
      {user ? (
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="h-auto min-h-12"
                  aria-label="Ouvrir le menu du compte"
                >
                  <Avatar>
                    <AvatarFallback>
                      {getUserInitials(user.firstName, user.lastName, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left leading-tight">
                    <span className="truncate font-medium">
                      {getDisplayName(user.firstName, user.lastName) || user.email}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" side="top" align="end" sideOffset={8}>
                <DropdownMenuLabel className="flex flex-col gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getUserInitials(user.firstName, user.lastName, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid min-w-0 flex-1 gap-0.5">
                      <span className="truncate font-medium">
                        {getDisplayName(user.firstName, user.lastName) || user.email}
                      </span>
                      <span className="truncate text-xs font-normal text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {getRoleLabel(user.role)}
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/account">
                      <UserRound />
                      Mon compte
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={isSubmitting || isLoading}
                    onSelect={(event) => {
                      event.preventDefault();
                      void handleLogout();
                    }}
                  >
                    <LogOut />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      ) : null}

      {!user && !isLoading ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/70 p-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Compte</p>
              <p className="text-xs text-muted-foreground">
                Connectez-vous ou créez un compte pour retrouver vos recherches.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" size="sm" className="flex-1" onClick={() => openDialog("login")}>
              <LogIn data-icon="inline-start" />
              Connexion
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => openDialog("register")}
            >
              <UserPlus data-icon="inline-start" />
              Inscription
            </Button>
          </div>
        </div>
      ) : null}

      {!user && isLoading ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/70 p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>
        </div>
      ) : null}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "login" ? "Connexion" : "Créer un compte"}</DialogTitle>
            <DialogDescription>
              {mode === "login"
                ? "Retrouvez vos candidatures, votre historique et votre espace personnel."
                : "Créez un compte pour suivre vos candidatures et conserver votre historique."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {mode === "register" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  id="auth-sidebar-first-name"
                  name="given-name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Prénom"
                />
                <Input
                  id="auth-sidebar-last-name"
                  name="family-name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Nom"
                />
              </div>
            ) : null}
            <Input
              id="auth-sidebar-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@example.com"
            />
            <Input
              id={mode === "login" ? "auth-sidebar-current-password" : "auth-sidebar-new-password"}
              name={mode === "login" ? "current-password" : "new-password"}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mot de passe (8 caractères minimum)"
            />
            {mode === "login" && runtimeConfig.auth.passwordResetEnabled ? (
              <Button
                type="button"
                variant="link"
                className="h-auto justify-start px-0 text-sm"
                onClick={() => setIsForgotPasswordDialogOpen(true)}
              >
                Mot de passe oublié ?
              </Button>
            ) : null}
            {mode === "register" ? (
              <Input
                id="auth-sidebar-confirm-password"
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
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => void handleAuth()}
              disabled={
                isSubmitting ||
                !email.trim() ||
                password.length < 8 ||
                (mode === "register" &&
                  (!firstName.trim() ||
                    !lastName.trim() ||
                    confirmPassword.length < 8 ||
                    password !== confirmPassword))
              }
            >
              {mode === "login" ? "Se connecter" : "Créer le compte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ForgotPasswordDialog
        open={isForgotPasswordDialogOpen}
        onOpenChange={setIsForgotPasswordDialogOpen}
      />
    </>
  );
}
