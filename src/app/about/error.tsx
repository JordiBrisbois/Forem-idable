"use client";

import { useEffect } from "react";
import { SegmentErrorState } from "@/components/errors/SegmentErrorState";

export default function AboutError({
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
      title="La page À propos n'a pas pu être affichée."
      description="Le contenu de présentation a planté pendant le rendu."
    />
  );
}
