"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobalError({
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
    <html lang="fr">
      <body>
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-8">
          <Card className="w-full border-border/60 bg-linear-to-br from-card to-muted/20">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle data-icon="inline-start" />
                Erreur globale
              </div>
              <CardTitle className="text-2xl sm:text-3xl">
                L&apos;application a rencontré une erreur critique.
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm sm:text-base">
                Un incident a empêché le chargement normal de l&apos;interface. Vous pouvez
                réessayer ou revenir à l&apos;accueil.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {error.digest ? (
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
        </main>
      </body>
    </html>
  );
}
