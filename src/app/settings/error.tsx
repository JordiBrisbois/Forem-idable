"use client";

import { useEffect } from "react";
import { SegmentErrorState } from "@/components/errors/SegmentErrorState";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <SegmentErrorState
      error={error}
      reset={reset}
      title="La page paramètres n'a pas pu être affichée."
      description="Les réglages de l'instance ont rencontré une erreur de rendu."
    />
  );
}
