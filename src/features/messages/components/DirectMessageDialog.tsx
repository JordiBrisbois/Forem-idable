"use client";

import { MessageSquareDashed, UserRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DirectMessageTarget } from "@/types/messaging";
import { getDisplayName, getInitials } from "@/features/messages/messages.utils";

export function DirectMessageDialog({
  open,
  contacts,
  contactQuery,
  contactsError,
  filteredContacts,
  isContactsLoading,
  onContactQueryChange,
  onOpenChange,
  onSelectContact,
}: {
  open: boolean;
  contacts: DirectMessageTarget[];
  contactQuery: string;
  contactsError: string | null;
  filteredContacts: DirectMessageTarget[];
  isContactsLoading: boolean;
  onContactQueryChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSelectContact: (contact: DirectMessageTarget) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouveau message privé</DialogTitle>
          <DialogDescription>
            Choisis une personne liée à l&apos;un de tes groupes.
          </DialogDescription>
        </DialogHeader>

        {contactsError ? (
          <Alert>
            <AlertTitle>Contacts indisponibles</AlertTitle>
            <AlertDescription>{contactsError}</AlertDescription>
          </Alert>
        ) : isContactsLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <Empty className="min-h-56 rounded-2xl border border-dashed border-border/60 bg-muted/10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserRound />
              </EmptyMedia>
              <EmptyTitle>Aucun contact disponible.</EmptyTitle>
              <EmptyDescription>
                Aucun message privé disponible pour le moment.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="contact-search">
                  Rechercher un contact autorisé
                </FieldLabel>
                <Input
                  id="contact-search"
                  value={contactQuery}
                  onChange={(event) => onContactQueryChange(event.target.value)}
                  placeholder="Nom ou email"
                />
              </Field>
            </FieldGroup>

            {filteredContacts.length === 0 ? (
              <Empty className="min-h-48 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageSquareDashed />
                  </EmptyMedia>
                  <EmptyTitle>Aucun contact trouvé.</EmptyTitle>
                  <EmptyDescription>
                    Aucun contact ne correspond à cette recherche.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ScrollArea className="max-h-[420px] pr-1">
                <div className="flex flex-col gap-2">
                  {filteredContacts.map((contact) => {
                    const displayName = getDisplayName({
                      firstName: contact.firstName,
                      lastName: contact.lastName,
                      email: contact.email,
                      fallback: "Contact",
                    });

                    return (
                      <button
                        key={contact.userId}
                        type="button"
                        className="flex flex-col gap-3 rounded-2xl border border-border/60 px-4 py-4 text-left transition-colors hover:border-primary/20 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                        onClick={() => {
                          void onSelectContact(contact);
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="border border-border/70 bg-background">
                            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{displayName}</span>
                              <Badge variant="outline" className="capitalize">
                                {contact.role}
                              </Badge>
                            </div>
                            <span className="truncate text-sm text-muted-foreground">
                              {contact.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{contact.relationLabel}</Badge>
                          <Badge variant="outline">
                            {contact.sharedGroupCount} groupe
                            {contact.sharedGroupCount > 1 ? "s" : ""} partagé
                            {contact.sharedGroupCount > 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
