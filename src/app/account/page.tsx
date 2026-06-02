"use client";

import { useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserRound } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { AccountAccessPrompt } from "@/components/auth/AccountAccessPrompt";
import { useAuth } from "@/components/auth/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { useAccountApiKeys } from "@/hooks/useAccountApiKeys";
import { useToastFeedback } from "@/hooks/useToastFeedback";

import {
  ApiKeyFormValues,
  apiKeySchema,
} from "./account.schemas";
import { useProfileForm } from "./hooks/useProfileForm";
import { usePasswordForm } from "./hooks/usePasswordForm";
import { useDataExports } from "./hooks/useDataExports";
import { useAccountDeletion } from "./hooks/useAccountDeletion";
import { AccountDeletionSection } from "./components/AccountDeletionSection";
import { ApiKeysSection } from "./components/ApiKeysSection";
import { DataExportSection } from "./components/DataExportSection";
import { PasswordSection } from "./components/PasswordSection";
import { ProfileSection } from "./components/ProfileSection";
import { SearchPreferencesSection } from "./components/SearchPreferencesSection";

const sectionClassName = "overflow-hidden shadow-sm";

function AccountPageSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-full max-w-3xl" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AccountPage() {
  const { user, isLoading } = useAuth();
  const { settings, updateSettings, isLoaded: isSettingsLoaded } = useSettings();
  const profile = useProfileForm();
  const password = usePasswordForm();
  const dataExports = useDataExports();
  const accountDeletion = useAccountDeletion();

  const apiKeyForm = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      expiry: "none",
    },
  });
  const [currentApiKeyName = "", currentApiKeyExpiry = "none"] = useWatch({
    control: apiKeyForm.control,
    name: ["name", "expiry"],
  });

  const canManageApiKeys = user?.role === "coach" || user?.role === "admin";
  const apiKeys = useAccountApiKeys({ enabled: canManageApiKeys });

  useToastFeedback(profile.feedback, { title: "Mise à jour du profil" });
  useToastFeedback(password.feedback, { title: "Mot de passe" });
  useToastFeedback(apiKeys.feedback, { title: "Clés API" });
  useToastFeedback(dataExports.feedback, { title: "Export de données" });
  useToastFeedback(accountDeletion.feedback, { title: "Suppression du compte" });

  const canSubmitApiKey =
    !apiKeys.isCreating &&
    currentApiKeyName.trim().length > 0 &&
    apiKeyForm.formState.isValid;

  const createApiKey = useCallback(async (values: ApiKeyFormValues) => {
    const wasCreated = await apiKeys.createApiKey(values);
    if (!wasCreated) {
      return;
    }

    apiKeyForm.reset({
      name: "",
      expiry: "none",
    });
  }, [apiKeyForm, apiKeys]);

  const handleSearchModeChange = useCallback(
    (value: "AND" | "OR") => {
      updateSettings({ defaultSearchMode: value });
    },
    [updateSettings]
  );

  if (isLoading || !isSettingsLoaded) {
    return <AccountPageSkeleton />;
  }

  if (!user) {
    return (
      <AccountAccessPrompt
        title="Mon compte"
        description="Connectez-vous pour gérer votre profil, votre mot de passe et vos clés API."
        summary="Avec un compte, vous retrouvez votre suivi, vos paramètres personnels et, pour les coachs, vos clés API."
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight">Mon compte</h1>
          <p className="max-w-2xl text-muted-foreground">
            Gérez votre profil, votre sécurité et vos préférences sans perdre d&apos;espace à
            l&apos;écran.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-2 px-3 py-1 text-sm">
            <UserRound className="h-3.5 w-3.5" />
            {user.email}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1 text-sm capitalize">
            {user.role}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className={sectionClassName}>
          <CardHeader>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl">Compte</CardTitle>
              <CardDescription>
                Gérez votre identité, votre mot de passe et vos préférences de recherche depuis un
                seul espace.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-6 items-start lg:grid-cols-2">
              <ProfileSection
                form={profile.form}
                canSubmit={profile.canSubmit}
                isSubmitting={profile.isSaving}
                onSubmit={profile.save}
              />
              <PasswordSection
                form={password.form}
                canSubmit={password.canSubmit}
                isSubmitting={password.isSaving}
                onSubmit={password.save}
              />
            </div>

            <Separator />

            <SearchPreferencesSection
              value={settings.defaultSearchMode}
              onChange={handleSearchModeChange}
            />
          </CardContent>
        </Card>

        {canManageApiKeys ? (
          <ApiKeysSection
            form={apiKeyForm}
            apiKeys={apiKeys.apiKeys}
            newApiKey={apiKeys.newApiKey}
            isLoading={apiKeys.isLoading}
            isCreating={apiKeys.isCreating}
            canSubmit={canSubmitApiKey}
            currentExpiry={currentApiKeyExpiry}
            revokingApiKeyId={apiKeys.revokingApiKeyId}
            onSubmit={createApiKey}
            onCopy={apiKeys.copyApiKey}
            onRevoke={apiKeys.revokeApiKey}
          />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <DataExportSection
            requests={dataExports.requests}
            isLoading={dataExports.isLoading}
            isExporting={dataExports.isGenerating}
            onCreate={dataExports.generate}
            onDownload={dataExports.download}
          />
          <AccountDeletionSection
            requests={accountDeletion.requests}
            isLoading={accountDeletion.isLoading}
            isSubmitting={accountDeletion.isSubmitting}
            onSubmit={accountDeletion.submit}
            onCancel={accountDeletion.cancel}
          />
        </div>
      </div>
    </div>
  );
}
