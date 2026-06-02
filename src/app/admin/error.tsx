"use client";

import { useEffect } from "react";
import { SegmentErrorState } from "@/components/errors/SegmentErrorState";

export default function AdminError({
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
      title="L'espace administration n'a pas pu etre affiche."
      description="La gestion des coachs, des recherches mises en avant ou des cles API a rencontre une erreur de rendu."
    />
  );
}
