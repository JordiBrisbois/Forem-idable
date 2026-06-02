"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { DeleteMessageDialog } from "@/features/messages/components/DeleteMessageDialog";
import { ConversationPanel } from "@/features/messages/components/ConversationPanel";
import { ConversationSidebar } from "@/features/messages/components/ConversationSidebar";
import { DirectMessageDialog } from "@/features/messages/components/DirectMessageDialog";
import { MessagesPageSkeleton } from "@/features/messages/components/MessagesPageSkeleton";
import { useMessagesPageState } from "@/features/messages/hooks/useMessagesPageState";

export function MessagesPageContent() {
  const page = useMessagesPageState();
  const isMobileViewport = useIsMobile();

  if (page.isLoading) {
    return <MessagesPageSkeleton />;
  }

  if (page.hasMessagingAccess === false) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 animate-in fade-in duration-500">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card py-0 shadow-sm">
          <div className="border-b border-border/60 px-6 py-6">
            <h1 className="text-2xl font-black tracking-tight">
              Messagerie indisponible
            </h1>
          </div>
          <div className="flex flex-col gap-3 px-6 py-5 text-sm text-muted-foreground">
            <p>
              La messagerie est réservée aux personnes rattachées à au moins un groupe de suivi.
            </p>
            <p>
              Lorsqu&apos;un groupe vous est attribué, les conversations de groupe et les messages privés apparaissent ici.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isMobileConversationVisible = isMobileViewport && page.isMobileConversationOpen && page.selectedPreview;

  return (
    <>
      <div className="-mx-4 -my-4 flex h-[calc(100svh-3.5rem)] w-[calc(100%+2rem)] flex-col gap-4 overflow-hidden px-0 animate-in fade-in duration-500 md:mx-auto md:my-0 md:h-[calc(100svh-3.5rem-2rem)] md:min-h-0 md:w-full md:max-w-[1440px] md:overflow-hidden md:px-4 lg:h-[calc(100svh-4rem-4rem)] lg:max-w-none lg:gap-0 lg:px-0">
        {/* Mobile: soit sidebar soit panel */}
        <div className="min-h-0 flex-1 md:hidden">
          {isMobileConversationVisible ? (
            <ConversationPanel
              selectedPreview={page.selectedPreview}
              selectedConversation={page.selectedConversation}
              error={page.error}
              isConversationLoading={page.isConversationLoading}
              isClosingDirectConversation={page.isClosingDirectConversation}
              trackedJobIds={page.trackedJobIds}
              draft={page.draft}
              isSending={page.isSending}
              isMobile
              onBack={() => page.setIsMobileConversationOpen(false)}
              onCloseDirectConversation={() => {
                void page.closeSelectedDirectConversation();
              }}
              onTrackJob={(job) => {
                void page.addSharedJobToApplications(job);
              }}
              onDeleteMessage={page.setMessagePendingDeletion}
              onDraftChange={page.setDraft}
              onSend={() => {
                void page.sendCurrentMessage();
              }}
              threadBottomRef={page.mobileThreadBottomRef}
              threadScrollAreaRef={page.mobileThreadScrollAreaRef}
            />
          ) : (
            <ConversationSidebar
              isMobile
              groupedConversations={page.groupedConversations}
              selectedConversationId={page.selectedConversationId}
              conversationQuery={page.conversationQuery}
              unreadConversationCount={page.unreadConversationCount}
              onConversationQueryChange={page.setConversationQuery}
              onOpenDirectDialog={() => page.setIsDirectDialogOpen(true)}
              onSelectConversation={page.openConversation}
            />
          )}
        </div>

        {/* Desktop: grid côte à côte */}
        <div className="hidden min-h-0 min-w-0 gap-4 md:grid md:h-full md:grid-cols-[360px_minmax(0,1fr)]">
          <ConversationSidebar
            groupedConversations={page.groupedConversations}
            selectedConversationId={page.selectedConversationId}
            conversationQuery={page.conversationQuery}
            unreadConversationCount={page.unreadConversationCount}
            onConversationQueryChange={page.setConversationQuery}
            onOpenDirectDialog={() => page.setIsDirectDialogOpen(true)}
            onSelectConversation={page.openConversation}
          />

          <ConversationPanel
            selectedPreview={page.selectedPreview}
            selectedConversation={page.selectedConversation}
            error={page.error}
            isConversationLoading={page.isConversationLoading}
            isClosingDirectConversation={page.isClosingDirectConversation}
            trackedJobIds={page.trackedJobIds}
            draft={page.draft}
            isSending={page.isSending}
            onCloseDirectConversation={() => {
              void page.closeSelectedDirectConversation();
            }}
            onTrackJob={(job) => {
              void page.addSharedJobToApplications(job);
            }}
            onDeleteMessage={page.setMessagePendingDeletion}
            onDraftChange={page.setDraft}
            onSend={() => {
              void page.sendCurrentMessage();
            }}
            threadBottomRef={page.desktopThreadBottomRef}
            threadScrollAreaRef={page.desktopThreadScrollAreaRef}
          />
        </div>
      </div>

      <DirectMessageDialog
        open={page.isDirectDialogOpen}
        contacts={page.contacts}
        contactQuery={page.contactQuery}
        contactsError={page.contactsError}
        filteredContacts={page.filteredContacts}
        isContactsLoading={page.isContactsLoading}
        onContactQueryChange={page.setContactQuery}
        onOpenChange={page.setIsDirectDialogOpen}
        onSelectContact={page.createDirectConversation}
      />

      <DeleteMessageDialog
        open={Boolean(page.messagePendingDeletion)}
        isDeleting={page.isDeletingMessage}
        onConfirm={() => {
          void page.deleteSelectedMessage();
        }}
        onOpenChange={(open) => {
          if (!open && !page.isDeletingMessage) {
            page.setMessagePendingDeletion(null);
          }
        }}
      />
    </>
  );
}
