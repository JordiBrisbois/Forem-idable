"use client";

import { useEffect } from "react";
import { SegmentErrorState } from "@/components/errors/SegmentErrorState";

export default function ResetPasswordError({
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
      title="La réinitialisation du mot de passe n'a pas pu être affichée."
      description="Le formulaire ou l'état de réinitialisation a rencontré une erreur."
    />
  );
}
