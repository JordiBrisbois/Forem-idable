"use client";

import { Button } from "@/components/ui/button";
import {
  setAnalyticsConsentChoice,
  useAnalyticsConsentChoice,
} from "@/features/consent/analyticsConsent";

export function PrivacyConsentControls() {
  const analyticsConsent = useAnalyticsConsentChoice();

  return (
    <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
      <p className="text-sm text-muted-foreground">
        Vous pouvez activer ou refuser les statistiques anonymes Umami à tout moment.
      </p>
      <p className="text-sm">
        Statut actuel:{" "}
        <span className="font-semibold">
          {analyticsConsent === "accepted"
            ? "Accepté"
            : analyticsConsent === "rejected"
              ? "Refusé"
              : "Non défini"}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={analyticsConsent === "accepted" ? "default" : "outline"}
          aria-pressed={analyticsConsent === "accepted"}
          onClick={() => setAnalyticsConsentChoice("accepted")}
        >
          Accepter
        </Button>
        <Button
          type="button"
          variant={analyticsConsent === "rejected" ? "default" : "outline"}
          aria-pressed={analyticsConsent === "rejected"}
          onClick={() => setAnalyticsConsentChoice("rejected")}
        >
          Refuser
        </Button>
      </div>
    </div>
  );
}
