"use client";

import { useEffect } from "react";
import { SegmentErrorState } from "@/components/errors/SegmentErrorState";

export default function RootError({
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
      title="L'application a rencontré un problème inattendu."
      description="La page a échoué pendant le rendu. Rechargez ce segment ou revenez au tableau de bord."
    />
  );
}
