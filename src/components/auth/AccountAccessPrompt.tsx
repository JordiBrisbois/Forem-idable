"use client";

import { useState } from "react";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";
import { Button } from "@/components/ui/button";
import { runtimeConfig } from "@/config/runtime";

interface AccountAccessPromptProps {
  title: string;
  description: string;
  summary: string;
  loginLabel?: string;
  registerLabel?: string;
  loginTitle?: string;
  registerTitle?: string;
  loginDescription?: string;
  registerDescription?: string;
}

export function AccountAccessPrompt({
  title,
  description,
  summary,
  loginLabel = "Connexion",
  registerLabel = "Créer un compte",
  loginTitle,
  registerTitle,
  loginDescription,
  registerDescription,
}: AccountAccessPromptProps) {
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const registrationEnabled = runtimeConfig.features.publicRegistration;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        <p className="text-lg text-muted-foreground">{description}</p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{summary}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={() => setIsLoginDialogOpen(true)}>
              {loginLabel}
            </Button>
            {registrationEnabled ? (
              <Button type="button" variant="outline" onClick={() => setIsRegisterDialogOpen(true)}>
                {registerLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <AuthRequiredDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
        mode="login"
        title={loginTitle}
        description={loginDescription}
      />
      {registrationEnabled ? (
        <AuthRequiredDialog
          open={isRegisterDialogOpen}
          onOpenChange={setIsRegisterDialogOpen}
          mode="register"
          title={registerTitle}
          description={registerDescription}
        />
      ) : null}
    </div>
  );
}
