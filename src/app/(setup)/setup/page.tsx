"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { runtimeConfig } from "@/config/runtime";
import { fetchSetupStatus, submitSetup } from "@/lib/api/setup";
import { SEARCH_GOAL_LABELS, SearchGoal } from "@/types/preferences";

export default function SetupPage() {
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [searchGoal, setSearchGoal] = useState<SearchGoal>(
    runtimeConfig.defaults.searchGoal
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { data } = await fetchSetupStatus();
        if (cancelled) return;
        if (!data.needsSetup) {
          window.location.replace("/");
          return;
        }
      } catch {
        // Fall through and let the user attempt setup.
      }
      if (!cancelled) setChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async () => {
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);

    try {
      await submitSetup({ email, password, firstName, lastName, searchGoal });
      toast.success("Instance configurée.");
      window.location.assign("/admin");
    } catch {
      toast.error("Configuration impossible.");
      setSubmitting(false);
    }
  };

  if (checking) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const canSubmit =
    !submitting &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    confirmPassword.length >= 8 &&
    password === confirmPassword &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0;

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="gap-2 px-6 py-6">
        <CardTitle className="text-2xl font-black tracking-tight">
          Configurer {runtimeConfig.app.name}
        </CardTitle>
        <CardDescription>
          Créez le compte administrateur de cette instance. Vous pourrez ensuite créer des
          coachs, des classes et y ajouter des personnes.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="setup-first-name">Prénom</Label>
              <Input
                id="setup-first-name"
                value={firstName}
                autoComplete="given-name"
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="setup-last-name">Nom</Label>
              <Input
                id="setup-last-name"
                value={lastName}
                autoComplete="family-name"
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="setup-email">Email administrateur</Label>
            <Input
              id="setup-email"
              type="email"
              autoComplete="email"
              value={email}
              placeholder="admin@exemple.be"
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="setup-goal">Objectif de recherche par défaut</Label>
            <Select
              value={searchGoal}
              onValueChange={(value) => setSearchGoal(value as SearchGoal)}
            >
              <SelectTrigger id="setup-goal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["internship", "job"] as SearchGoal[]).map((goal) => (
                  <SelectItem key={goal} value={goal}>
                    {SEARCH_GOAL_LABELS[goal]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="setup-password">Mot de passe</Label>
            <Input
              id="setup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              placeholder="8 caractères minimum"
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="setup-confirm-password">Confirmer le mot de passe</Label>
            <Input
              id="setup-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          <Button type="submit" disabled={!canSubmit} className="mt-2">
            {submitting ? "Configuration..." : "Créer l'administrateur"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
