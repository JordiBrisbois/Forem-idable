"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageSquareDashed, UserRound, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ConversationPreview } from "@/types/messaging";
import { ConversationAvatar } from "@/features/messages/components/MessagesPrimitives";
import { cn } from "@/lib/utils";

function ConversationListItem({
  conversation,
  isSelected,
  isMobile,
  onSelect,
}: {
  conversation: ConversationPreview;
  isSelected: boolean;
  isMobile?: boolean;
  onSelect: (conversationId: number) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all",
        isMobile && "gap-3 rounded-[1.4rem] border-x-0 border-t-0 border-b border-border/50 px-1 py-3.5",
        isSelected
          ? "border-primary/35 bg-primary/8 shadow-sm"
          : "border-border/60 bg-background/70 hover:border-primary/20 hover:bg-muted/40"
      )}
      onClick={() => onSelect(conversation.id)}
    >
      <ConversationAvatar conversation={conversation} size={isMobile ? "default" : "lg"} />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={cn("line-clamp-2 break-words font-medium", isMobile && "line-clamp-1")}>
              {conversation.title}
            </p>
            {conversation.subtitle ? (
              <p className={cn("truncate text-sm text-muted-foreground", isMobile && "text-xs")}>
                {conversation.subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className={cn("text-xs text-muted-foreground", isMobile && "text-[11px]")}>
              {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
            {conversation.unreadCount > 0 ? (
              <Badge variant="secondary" className="bg-primary/15 text-primary hover:bg-primary/20">
                {conversation.unreadCount}
              </Badge>
            ) : null}
          </div>
        </div>

        <p className={cn("line-clamp-2 text-sm text-muted-foreground", isMobile && "line-clamp-1")}>
          {conversation.lastMessagePreview || "Pas encore de message."}
        </p>
      </div>
    </button>
  );
}

export function ConversationSidebar({
  isMobile,
  groupedConversations,
  selectedConversationId,
  conversationQuery,
  unreadConversationCount,
  onConversationQueryChange,
  onOpenDirectDialog,
  onSelectConversation,
}: {
  isMobile?: boolean;
  groupedConversations: {
    group: ConversationPreview[];
    direct: ConversationPreview[];
  };
  selectedConversationId: number | null;
  conversationQuery: string;
  unreadConversationCount: number;
  onConversationQueryChange: (value: string) => void;
  onOpenDirectDialog: () => void;
  onSelectConversation: (conversationId: number) => void;
}) {
  const [mobileFilter, setMobileFilter] = useState<"all" | "group" | "direct">("all");
  const normalizedQuery = conversationQuery.trim().toLowerCase();

  const filteredGroupConversations = useMemo(() => {
    if (!normalizedQuery) return groupedConversations.group;
    return groupedConversations.group.filter((c) =>
      `${c.title} ${c.subtitle ?? ""} ${c.lastMessagePreview ?? ""}`.toLowerCase().includes(normalizedQuery)
    );
  }, [groupedConversations.group, normalizedQuery]);

  const filteredDirectConversations = useMemo(() => {
    if (!normalizedQuery) return groupedConversations.direct;
    return groupedConversations.direct.filter((c) =>
      `${c.title} ${c.subtitle ?? ""} ${c.lastMessagePreview ?? ""}`.toLowerCase().includes(normalizedQuery)
    );
  }, [groupedConversations.direct, normalizedQuery]);

  const mobileConversations = useMemo(() => {
    const source =
      mobileFilter === "group"
        ? filteredGroupConversations
        : mobileFilter === "direct"
          ? filteredDirectConversations
          : [...filteredGroupConversations, ...filteredDirectConversations].sort(
              (left, right) =>
                new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime()
            );
    return source;
  }, [filteredDirectConversations, filteredGroupConversations, mobileFilter]);

  const hasConversations =
    groupedConversations.group.length > 0 || groupedConversations.direct.length > 0;

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/60 py-0 md:flex md:h-full md:flex-col",
        isMobile &&
          "flex h-full rounded-none border-x-0 border-y-0 bg-background shadow-none"
      )}
    >
      <CardHeader
        className={cn(
          "border-b border-border/60 px-4 py-3.5",
          isMobile && "sticky top-0 z-10 bg-background/95 px-4 pb-3 pt-3 backdrop-blur"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className={cn("text-lg", isMobile && "text-xl font-black tracking-tight")}>
                Conversations
              </CardTitle>
              <Badge variant="outline">
                {unreadConversationCount} non lu{unreadConversationCount > 1 ? "s" : ""}
              </Badge>
            </div>
            {isMobile ? (
              <>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="dm-search" className="sr-only">
                      Rechercher un message privé
                    </FieldLabel>
                    <Input
                      id="dm-search"
                      value={conversationQuery}
                      onChange={(event) => onConversationQueryChange(event.target.value)}
                      placeholder="Rechercher"
                      className="h-11 rounded-full bg-muted/35"
                    />
                  </Field>
                </FieldGroup>
                <ToggleGroup
                  type="single"
                  value={mobileFilter}
                  onValueChange={(value) => {
                    if (value === "all" || value === "group" || value === "direct") {
                      setMobileFilter(value);
                    }
                  }}
                  className="grid grid-cols-3 gap-2"
                >
                  <ToggleGroupItem value="all" className="rounded-full text-xs">
                    Tout
                  </ToggleGroupItem>
                  <ToggleGroupItem value="group" className="rounded-full text-xs">
                    Groupes
                  </ToggleGroupItem>
                  <ToggleGroupItem value="direct" className="rounded-full text-xs">
                    Privés
                  </ToggleGroupItem>
                </ToggleGroup>
              </>
            ) : (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="sidebar-search" className="sr-only">
                    Rechercher une conversation
                  </FieldLabel>
                  <Input
                    id="sidebar-search"
                    value={conversationQuery}
                    onChange={(event) => onConversationQueryChange(event.target.value)}
                    placeholder="Rechercher une conversation..."
                    className="h-9 rounded-lg bg-muted/30"
                  />
                </Field>
              </FieldGroup>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isMobile ? "default" : "outline"}
              size={isMobile ? "icon" : "sm"}
              className={cn(isMobile ? "mt-0.5 size-11 rounded-full shadow-sm" : "hidden md:inline-flex")}
              onClick={onOpenDirectDialog}
              aria-label="Nouveau DM"
            >
              <UserRound className="size-4" />
              {!isMobile ? "Nouveau DM" : null}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "min-h-0 flex-1 px-3 py-3",
          isMobile && "flex min-h-0 flex-1 flex-col px-3 pb-4 pt-3"
        )}
      >
        {!hasConversations ? (
          <Empty className="min-h-72 rounded-2xl border border-dashed border-border/60 bg-muted/10">
            <EmptyHeader>
              <EmptyMedia variant="icon"><MessageSquareDashed /></EmptyMedia>
              <EmptyTitle>Aucune conversation.</EmptyTitle>
              <EmptyDescription>
                Les groupes et messages privés apparaîtront ici.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex h-full flex-col gap-4">
            <ScrollArea
              className={cn(
                "min-h-0 pr-1 md:h-full",
                isMobile ? "h-full" : "h-[min(64vh,42rem)]"
              )}
            >
              {isMobile ? (
                mobileConversations.length === 0 ? (
                  <Empty className="min-h-72 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><MessageSquareDashed /></EmptyMedia>
                      <EmptyTitle>Aucune conversation trouvée.</EmptyTitle>
                      <EmptyDescription>Aucun résultat pour cette recherche.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="flex flex-col gap-1 pb-2">
                    {mobileConversations.map((conversation) => (
                      <ConversationListItem
                        key={conversation.id}
                        conversation={conversation}
                        isSelected={selectedConversationId === conversation.id}
                        isMobile={isMobile}
                        onSelect={onSelectConversation}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="flex flex-col gap-4 pb-1">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-3 px-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Groupes
                      </p>
                      <Badge variant="outline">{filteredGroupConversations.length}</Badge>
                    </div>

                    {groupedConversations.group.length === 0 ? (
                      <Empty className="min-h-40 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><Users /></EmptyMedia>
                          <EmptyTitle>Aucun groupe actif.</EmptyTitle>
                          <EmptyDescription>Les conversations de groupe apparaîtront ici.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : filteredGroupConversations.length === 0 ? (
                      <Empty className="min-h-40 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><MessageSquareDashed /></EmptyMedia>
                          <EmptyTitle>Aucun résultat.</EmptyTitle>
                          <EmptyDescription>Aucun groupe ne correspond à cette recherche.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      filteredGroupConversations.map((conversation) => (
                        <ConversationListItem
                          key={conversation.id}
                          conversation={conversation}
                          isSelected={selectedConversationId === conversation.id}
                          isMobile={isMobile}
                          onSelect={onSelectConversation}
                        />
                      ))
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-3 px-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Messages privés
                      </p>
                      <Badge variant="outline">{filteredDirectConversations.length}</Badge>
                    </div>

                    {groupedConversations.direct.length === 0 ? (
                      <Empty className="min-h-40 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><UserRound /></EmptyMedia>
                          <EmptyTitle>Aucun DM ouvert.</EmptyTitle>
                          <EmptyDescription>Ouvre un message privé avec le bouton en haut.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : filteredDirectConversations.length === 0 ? (
                      <Empty className="min-h-40 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><MessageSquareDashed /></EmptyMedia>
                          <EmptyTitle>Aucun résultat.</EmptyTitle>
                          <EmptyDescription>Aucun message privé ne correspond à cette recherche.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      filteredDirectConversations.map((conversation) => (
                        <ConversationListItem
                          key={conversation.id}
                          conversation={conversation}
                          isSelected={selectedConversationId === conversation.id}
                          isMobile={isMobile}
                          onSelect={onSelectConversation}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
