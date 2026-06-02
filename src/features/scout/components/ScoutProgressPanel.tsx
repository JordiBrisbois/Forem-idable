"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ScoutProgressPanelProps {
  step: number;
  total: number;
  found: number;
  message?: string;
}

export function ScoutProgressPanel({ step, total, found, message }: ScoutProgressPanelProps) {
  const percent = total > 0 ? Math.round((step / total) * 100) : 0;

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Loader2 className="animate-spin text-primary" />
          Recherche en cours...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {step} / {total} étapes
          </span>
          <span>{found} entreprises trouvées</span>
        </div>
        {message && <p className="break-words text-xs text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}
