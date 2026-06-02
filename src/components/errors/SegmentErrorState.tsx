"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SegmentErrorStateProps = {
  error?: Error & { digest?: string };
  reset: () => void;
  title: string;
  description: string;
};

export function SegmentErrorState({
  error,
  reset,
  title,
  description,
}: SegmentErrorStateProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-destructive">
            <AlertTriangle data-icon="inline-start" />
            Incident d&apos;affichage
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error?.digest ? (
            <p className="text-xs text-muted-foreground">
              Référence: <code>{error.digest}</code>
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={reset}>
              <RotateCcw data-icon="inline-start" />
              Réessayer
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/">Retour à l&apos;accueil</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
