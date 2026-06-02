import { memo } from "react";
import { Copy, KeyRound, Trash2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ApiKeySummary } from "@/types/externalApi";
import {
  API_KEY_ENDPOINTS,
  API_KEY_EXPIRY_OPTIONS,
  ApiKeyFormValues,
} from "../account.schemas";
import { formatDateTime, isApiKeyExpiry } from "../account.utils";
import { AccountField } from "./AccountField";

type ApiKeysSectionProps = {
  form: UseFormReturn<ApiKeyFormValues>;
  apiKeys: ApiKeySummary[];
  newApiKey: string | null;
  isLoading: boolean;
  isCreating: boolean;
  canSubmit: boolean;
  currentExpiry: ApiKeyFormValues["expiry"];
  revokingApiKeyId: number | null;
  onSubmit: (values: ApiKeyFormValues) => Promise<void>;
  onCopy: () => Promise<void>;
  onRevoke: (keyId: number) => Promise<void>;
};

function ApiKeysSectionComponent({
  form,
  apiKeys,
  newApiKey,
  isLoading,
  isCreating,
  canSubmit,
  currentExpiry,
  revokingApiKeyId,
  onSubmit,
  onCopy,
  onRevoke,
}: ApiKeysSectionProps) {
  const expiryError = form.formState.errors.expiry?.message;

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <KeyRound data-icon="inline-start" className="text-primary" />
          Clés API
        </CardTitle>
        <CardDescription>
          Génère des clés Bearer en lecture seule pour Excel, Power Query ou d&apos;autres
          intégrations.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Separator />

        <form
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
          })}
        >
          <FieldGroup className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
            <AccountField
              id="account-api-key-name"
              label="Nom de la clé"
              placeholder="Ex: Excel Jordi, Power Query coach, Zapier..."
              error={form.formState.errors.name?.message}
              {...form.register("name")}
            />
            <Field data-invalid={expiryError ? "true" : undefined}>
              <FieldLabel htmlFor="account-api-key-expiry">Expiration</FieldLabel>
              <Select
                value={currentExpiry}
                onValueChange={(value) => {
                  if (!isApiKeyExpiry(value)) {
                    return;
                  }

                  form.setValue("expiry", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger
                  id="account-api-key-expiry"
                  className="w-full"
                  aria-invalid={expiryError ? "true" : "false"}
                >
                  <SelectValue placeholder="Expiration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {API_KEY_EXPIRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {expiryError ? <FieldError>{expiryError}</FieldError> : null}
            </Field>
          </FieldGroup>
          <Button type="submit" disabled={!canSubmit || isCreating}>
            Générer une clé
          </Button>
        </form>

        {newApiKey ? (
          <Alert>
            <AlertTitle>Nouvelle clé API</AlertTitle>
            <AlertDescription className="gap-3">
              <p>Elle n&apos;est affichée qu&apos;une seule fois. Copie-la maintenant.</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <code className="block min-w-0 flex-1 overflow-x-auto rounded-lg border bg-background px-3 py-2 text-xs">
                  {newApiKey}
                </code>
                <Button type="button" variant="outline" onClick={() => void onCopy()}>
                  <Copy data-icon="inline-start" />
                  Copier
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        <Card className="shadow-none">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Endpoints disponibles</CardTitle>
            <CardDescription>
              Authentification: header <code>Authorization: Bearer VOTRE_CLE</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="grid gap-1 text-xs md:grid-cols-2">
              {API_KEY_ENDPOINTS.map((endpoint) => (
                <li key={endpoint}>
                  <code>{endpoint}</code>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          {apiKeys.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col gap-3 rounded-xl border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">{entry.name}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.keyPrefix}...{entry.lastFour}
                </p>
                <p className="text-xs text-muted-foreground">
                  Créée: {formatDateTime(entry.createdAt)}
                  {entry.expiresAt
                    ? ` • Expire: ${formatDateTime(entry.expiresAt)}`
                    : " • Sans expiration"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.lastUsedAt
                    ? ` • Dernier usage: ${formatDateTime(entry.lastUsedAt)}`
                    : "Jamais utilisée"}
                </p>
                {entry.revokedAt ? (
                  <p className="text-xs font-medium text-destructive">
                    Révoquée le {formatDateTime(entry.revokedAt)}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={Boolean(entry.revokedAt) || revokingApiKeyId === entry.id}
                onClick={() => void onRevoke(entry.id)}
              >
                <Trash2 data-icon="inline-start" />
                Révoquer
              </Button>
            </div>
          ))}
          {!isLoading && apiKeys.length === 0 ? (
            <Empty className="min-h-40 border">
              <EmptyHeader>
                <EmptyTitle>Aucune clé API pour l&apos;instant.</EmptyTitle>
                <EmptyDescription>
                  Générez une première clé pour connecter Excel, Power Query ou une intégration
                  externe.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export const ApiKeysSection = memo(ApiKeysSectionComponent);
