"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Script from "next/script";
import { runtimeConfig } from "@/config/runtime";
import { Button } from "@/components/ui/button";
import {
  setAnalyticsConsentChoice,
  useAnalyticsConsentChoice,
} from "@/features/consent/analyticsConsent";

interface AnalyticsConsentProps {
  umamiEnabled: boolean;
  umamiWebsiteId: string;
  umamiScriptUrl: string;
}

function subscribeHydration() {
  return () => {};
}

export function AnalyticsConsent({
  umamiEnabled,
  umamiWebsiteId,
  umamiScriptUrl,
}: AnalyticsConsentProps) {
  const effectiveChoice = useAnalyticsConsentChoice();
  const isHydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);

  const shouldShowBanner = isHydrated && umamiEnabled && effectiveChoice === null;
  const shouldLoadUmami =
    isHydrated &&
    umamiEnabled &&
    effectiveChoice === "accepted" &&
    umamiWebsiteId.length > 0 &&
    umamiScriptUrl.length > 0;

  const handleAccept = () => {
    setAnalyticsConsentChoice("accepted");
  };

  const handleReject = () => {
    setAnalyticsConsentChoice("rejected");
  };

  return (
    <>
      {shouldLoadUmami ? (
        <Script
          src={umamiScriptUrl}
          data-website-id={umamiWebsiteId}
          strategy="afterInteractive"
        />
      ) : null}

      {shouldShowBanner ? (
        <section
          role="dialog"
          aria-live="polite"
          aria-label="Consentement des statistiques"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-xl border bg-card/95 p-4 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/85"
        >
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-card-foreground">
              {runtimeConfig.app.name} stocke localement les donn&eacute;es n&eacute;cessaires &agrave; son
              fonctionnement, comme vos pr&eacute;f&eacute;rences d&apos;interface et votre choix de consentement.
              Si vous vous connectez, vos candidatures et votre historique de recherche sont alors
              enregistr&eacute;s dans votre compte.
            </p>
            <p className="text-sm leading-relaxed text-card-foreground">
              Les statistiques anonymes de navigation via Umami sont facultatives. Voulez-vous les
              autoriser pour nous aider &agrave; am&eacute;liorer l&apos;exp&eacute;rience ?
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="default" onClick={handleAccept}>
              Accepter
            </Button>
            <Button type="button" variant="outline" onClick={handleReject}>
              Refuser
            </Button>
            <Button asChild type="button" variant="ghost">
              <Link href="/privacy">En savoir plus</Link>
            </Button>
          </div>
        </section>
      ) : null}
    </>
  );
}
