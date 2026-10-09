"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createCoachAccount } from "@/features/admin/adminApi";

interface AdminCreateCoachDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => Promise<void> | void;
}

export function AdminCreateCoachDialog({
  open,
  onOpenChange,
  onCreated,
}: AdminCreateCoachDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setCreatedCredentials(null);
    setCopied(false);
    setIsSubmitting(false);
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const { response, data } = await createCoachAccount({
        email,
        firstName,
        lastName,
        password: password.trim() || undefined,
      });

      if (!response.ok || !data.user) {
        toast.error(data.error || "Création du coach impossible.");
        return;
      }

      setCreatedCredentials({
        email: data.user.email,
        password: data.temporaryPassword ?? password,
      });
      toast.success("Coach créé.");
      await onCreated?.();
    } catch {
      toast.error("Création du coach impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    !isSubmitting &&
    email.trim().length > 0 &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    (password.length === 0 || password.length >= 8);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {createdCredentials ? (
          <>
            <DialogHeader>
              <DialogTitle>Coach créé</DialogTitle>
              <DialogDescription>
                Transmettez ces identifiants au coach. Le mot de passe ne sera plus affiché.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm">
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{createdCredentials.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Mot de passe temporaire</p>
                <p className="font-mono font-medium">{createdCredentials.password}</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard
                    .writeText(
                      `Email: ${createdCredentials.email}\nMot de passe: ${createdCredentials.password}`
                    )
                    .then(() => {
                      setCopied(true);
                      toast.success("Identifiants copiés.");
                    })
                    .catch(() => toast.error("Copie impossible."));
                }}
              >
                {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
                Copier
              </Button>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Terminer
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Créer un coach</DialogTitle>
              <DialogDescription>
                Un mot de passe temporaire est généré automatiquement s&apos;il n&apos;est pas
                renseigné.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="create-coach-first-name">Prénom</FieldLabel>
                  <Input
                    id="create-coach-first-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="create-coach-last-name">Nom</FieldLabel>
                  <Input
                    id="create-coach-last-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="create-coach-email">Email</FieldLabel>
                <Input
                  id="create-coach-email"
                  type="email"
                  value={email}
                  placeholder="coach@exemple.be"
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="create-coach-password">
                  Mot de passe (optionnel)
                </FieldLabel>
                <Input
                  id="create-coach-password"
                  type="text"
                  value={password}
                  placeholder="Laisser vide pour générer"
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Annuler
              </Button>
              <Button type="button" onClick={() => void submit()} disabled={!canSubmit}>
                {isSubmitting ? "Création..." : "Créer le coach"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
