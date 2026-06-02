"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ApplicationsPageIntro() {
  return (
    <Card className="overflow-hidden border-border/60 bg-card py-0">
      <CardHeader className="gap-4 border-b border-border/60 px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Candidatures</Badge>
          <Badge variant="outline">Suivi personnel</Badge>
        </div>
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">
            Candidatures envoyées
          </CardTitle>
          <CardDescription className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            Gardez une vue claire sur vos envois, relances, entretiens et mises à jour coach
            depuis le même espace.
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
