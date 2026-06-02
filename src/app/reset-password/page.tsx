import { Suspense } from "react";
import { ResetPasswordContent } from "@/app/reset-password/ResetPasswordContent";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in duration-500">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Réinitialisation du mot de passe</h1>
            <p className="text-lg text-muted-foreground">Chargement...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
