import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center">
      <Card className="w-full border-border/60 bg-linear-to-br from-card to-muted/20">
        <CardHeader className="gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Compass data-icon="inline-start" />
            Page introuvable
          </div>
          <CardTitle className="text-2xl sm:text-3xl">
            Cette route n&apos;existe pas ou plus.
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm sm:text-base">
            Le lien est peut-être incomplet, obsolète, ou la page a été déplacée.
            Revenez à l&apos;accueil pour relancer une recherche.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">
              <Home data-icon="inline-start" />
              Retour à l&apos;accueil
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
