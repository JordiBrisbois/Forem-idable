"use client";

import { useCallback, useEffect, useState } from "react";
import { buildApiKeyExpiryDate } from "@/app/account/account.utils";
import { ApiKeyFormValues, FeedbackState } from "@/app/account/account.schemas";
import {
  fetchAccountApiKeys,
  createAccountApiKey as apiCreateAccountApiKey,
  revokeAccountApiKey as apiRevokeAccountApiKey,
} from "@/lib/api/account";
import { ApiKeySummary } from "@/types/externalApi";

type UseAccountApiKeysOptions = {
  enabled: boolean;
};

export function useAccountApiKeys({ enabled }: UseAccountApiKeysOptions) {
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingApiKeyId, setRevokingApiKeyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setApiKeys([]);
      setFeedback(null);
      setNewApiKey(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const { data } = await fetchAccountApiKeys();
      if (!data.apiKeys) {
        setFeedback({
          type: "error",
          message: "Chargement des clés API impossible.",
        });
        setApiKeys([]);
        return;
      }
      setApiKeys(data.apiKeys);
    } catch {
      setFeedback({
        type: "error",
        message: "Chargement des clés API impossible.",
      });
      setApiKeys([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createApiKey = useCallback(async (values: ApiKeyFormValues) => {
    setIsCreating(true);
    setFeedback(null);
    setNewApiKey(null);

    try {
      const { data } = await apiCreateAccountApiKey({
        name: values.name,
        expiresAt: buildApiKeyExpiryDate(values.expiry),
      });

      if (!data.apiKey || !data.plainTextKey) {
        setFeedback({
          type: "error",
          message: "Création de la clé API impossible.",
        });
        return false;
      }

      setNewApiKey(data.plainTextKey);
      setFeedback({
        type: "success",
        message: "Clé API créée. Copie-la maintenant: elle ne sera plus réaffichée.",
      });
      setApiKeys((current) => [data.apiKey as ApiKeySummary, ...current]);
      return true;
    } catch {
      setFeedback({
        type: "error",
        message: "Création de la clé API impossible.",
      });
      return false;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const revokeApiKey = useCallback(async (keyId: number) => {
    setRevokingApiKeyId(keyId);
    setFeedback(null);

    try {
      await apiRevokeAccountApiKey(keyId);
      setApiKeys((current) => current.filter((entry) => entry.id !== keyId));
      setFeedback({
        type: "success",
        message: "Clé API révoquée.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Révocation impossible.",
      });
    } finally {
      setRevokingApiKeyId(null);
    }
  }, []);

  const copyApiKey = useCallback(async () => {
    if (!newApiKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(newApiKey);
      setFeedback({
        type: "success",
        message: "Clé API copiée.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Copie impossible, sélectionne la clé manuellement.",
      });
    }
  }, [newApiKey]);

  return {
    apiKeys,
    feedback,
    newApiKey,
    isLoading,
    isCreating,
    revokingApiKeyId,
    createApiKey,
    revokeApiKey,
    copyApiKey,
  };
}
