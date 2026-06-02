"use client";

import { useEffect, useMemo, useState } from "react";
import { MessagesSquare, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ForemIdableLogo } from "@/components/branding/ForemIdableLogo";
import {
  FOOTER_NAV_ITEMS,
  type AppSidebarNavItem,
  getSidebarNavItems,
  isSidebarItemActive,
  isSidebarSubItemActive,
  isSidebarSubItemVisible,
} from "@/components/app-shell.config";
import { AuthSidebarPanel } from "@/components/auth/AuthSidebarPanel";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchConversations } from "@/features/messages/messages.api";
import { Button } from "@/components/ui/button";
import { runtimeConfig } from "@/config/runtime";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ConversationPreview } from "@/types/messaging";

function AppSidebarBrand() {
  return (
    <SidebarHeader className="border-b px-4 py-4">
      <div className="flex items-center">
        <ForemIdableLogo className="h-8" />
      </div>
      <p className="mt-1 text-xs font-medium italic text-muted-foreground">
        {runtimeConfig.app.tagline}
      </p>
    </SidebarHeader>
  );
}

function AppSidebarNavigation({
  pathname,
  hash,
  items,
  unreadMessagesCount,
}: {
  pathname: string;
  hash: string;
  items: AppSidebarNavItem[];
  unreadMessagesCount: number;
}) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            isActive={isSidebarItemActive(pathname, item.url)}
            className={cn(
              item.accent &&
                "border-transparent bg-primary/5 font-medium text-foreground shadow-none hover:bg-primary/10 dark:bg-primary/10 dark:text-sky-50 dark:hover:bg-primary/15"
            )}
          >
            <Link href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
          {item.url === "/messages" && unreadMessagesCount > 0 ? (
            <SidebarMenuBadge>{unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}</SidebarMenuBadge>
          ) : null}

          {isSidebarSubItemVisible(pathname, item) ? (
            <SidebarMenuSub className="mt-2">
              {item.children?.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isSidebarSubItemActive(pathname, hash, subItem.url)}
                  >
                    <Link href={subItem.url}>{subItem.title}</Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          ) : null}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function AppSidebarFooterLinks({ pathname }: { pathname: string }) {
  return (
    <SidebarMenu className="flex-1">
      {FOOTER_NAV_ITEMS.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            isActive={isSidebarItemActive(pathname, item.url)}
            tooltip={item.title}
          >
            <Link href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }}
      className="rounded-full"
    >
      <Sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Changer le thème</span>
    </Button>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [currentHash, setCurrentHash] = useState("");
  const [messagingConversations, setMessagingConversations] = useState<ConversationPreview[] | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncHash = () => {
      setCurrentHash(window.location.hash);
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, [pathname]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      return;
    }

    let cancelled = false;

    async function loadMessagingMeta() {
      try {
        const { response, data } = await fetchConversations();

        if (!response.ok || !data.conversations) {
          if (!cancelled) {
            setMessagingConversations([]);
          }
          return;
        }

        if (!cancelled) {
          setMessagingConversations(data.conversations);
        }
      } catch {
        if (!cancelled) {
          setMessagingConversations([]);
        }
      }
    }

    void loadMessagingMeta();

    const isOnMessagesPage = pathname === "/messages";
    const intervalId = isOnMessagesPage
      ? null
      : window.setInterval(() => {
          void loadMessagingMeta();
        }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadMessagingMeta();
      }
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoading, user, pathname]);

  const messagingNav = useMemo(() => {
    const conversations = messagingConversations ?? [];
    if (!user) {
      return {
        hasGroupMessagingAccess: false,
        unreadCount: 0,
      };
    }

    const hasGroupMessagingAccess = conversations.some((conversation) => conversation.type === "group");
    const unreadCount = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);

    return {
      hasGroupMessagingAccess,
      unreadCount,
    };
  }, [messagingConversations, user]);

  const navItems = useMemo(() => {
    const baseItems = getSidebarNavItems(user?.role, !!user);
    if (!messagingNav.hasGroupMessagingAccess) {
      return baseItems;
    }

    const messagesItem: AppSidebarNavItem = {
      title: "Messages",
      url: "/messages",
      icon: MessagesSquare,
    };

    const insertionIndex = baseItems.findIndex((item) => item.url === "/account");
    if (insertionIndex === -1) {
      return [...baseItems, messagesItem];
    }

    return [
      ...baseItems.slice(0, insertionIndex),
      messagesItem,
      ...baseItems.slice(insertionIndex),
    ];
  }, [messagingNav.hasGroupMessagingAccess, user]);

  return (
    <Sidebar>
      <AppSidebarBrand />

      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <AppSidebarNavigation
              pathname={pathname}
              hash={currentHash}
              items={navItems}
              unreadMessagesCount={messagingNav.unreadCount}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex flex-col gap-3">
          <AuthSidebarPanel />
          <div className="flex items-center gap-2">
            <AppSidebarFooterLinks pathname={pathname} />
            <ThemeToggleButton />
          </div>
        </div>
        <p className="mt-2 px-2 text-[11px] leading-4 text-muted-foreground">
          {runtimeConfig.brand.copyrightName} ·{" "}
          <a
            href={runtimeConfig.privacy.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            {runtimeConfig.app.name}
          </a>{" "}
          · {runtimeConfig.app.currentYear}
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
