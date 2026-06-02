"use client";

import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, FolderKanban, History, Sparkles } from "lucide-react";

interface CoachPageHeaderProps {
  role: "coach" | "admin";
  undoLabel: string | null;
  onUndo: () => void;
}

export function CoachPageHeader({
  role,
  undoLabel,
  onUndo,
}: CoachPageHeaderProps) {
  const quickLinks = [
    { href: "#a-traiter", label: "Priorités", icon: Sparkles },
    { href: "#activite-recente", label: "Activité", icon: History },
    { href: "#groupes", label: "Groupes", icon: FolderKanban },
  ];

  return (
    <Card className="overflow-hidden border-border/60 bg-card py-0">
      <CardHeader className="gap-5 border-b border-border/60 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {role}
              </Badge>
              <Badge variant="outline">
                {role === "admin" ? "Pilotage + administration" : "Pilotage quotidien"}
              </Badge>
            </div>
            <div className="flex flex-col gap-1.5">
              <CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">
                Suivi des bénéficiaires
              </CardTitle>
              <CardDescription className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                Tour de contrôle pour repérer les urgences, ouvrir une fiche
                rapidement et gérer les groupes sans quitter la même vue.
              </CardDescription>
            </div>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-auto lg:min-w-[420px]">
            {quickLinks.map((link) => {
              const Icon = link.icon;

              return (
                <Button
                  key={link.href}
                  asChild
                  variant="outline"
                  className="justify-between bg-card/80"
                >
                  <a href={link.href}>
                    <span className="inline-flex items-center gap-2">
                      <Icon data-icon="inline-start" />
                      {link.label}
                    </span>
                    <ArrowRight data-icon="inline-end" />
                  </a>
                </Button>
              );
            })}
            {role === "admin" ? (
              <Button asChild variant="secondary" className="justify-between sm:col-span-3">
                <Link href="/admin">
                  <span>Ouvrir l&apos;administration</span>
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      {undoLabel ? (
        <CardContent className="px-6 py-4">
          <Alert className="flex flex-wrap items-center justify-between gap-3 border-border/60 bg-card">
            <AlertDescription>{undoLabel}</AlertDescription>
            <Button type="button" size="sm" variant="outline" onClick={onUndo}>
              Annuler
            </Button>
          </Alert>
        </CardContent>
      ) : null}
    </Card>
  );
}
