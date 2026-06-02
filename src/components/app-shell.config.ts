import {
  Briefcase,
  CircleHelp,
  MapPin,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { UserRole } from "@/types/auth";

export interface AppSidebarNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  accent?: boolean;
  children?: Array<{
    title: string;
    url: string;
  }>;
}

const BASE_NAV_ITEMS: AppSidebarNavItem[] = [
  { title: "Recherche", url: "/", icon: Briefcase },
  { title: "Candidatures", url: "/applications", icon: Send },
  { title: "Scout", url: "/scout", icon: MapPin },
  { title: "Mon compte", url: "/account", icon: UserRound },
  { title: "À propos", url: "/about", icon: CircleHelp },
];

const COACH_NAV_ITEM: AppSidebarNavItem = {
  title: "Suivi bénéficiaires",
  url: "/coach",
  icon: Users,
  accent: true,
  children: [
    { title: "À traiter", url: "/coach#a-traiter" },
    { title: "Activité récente", url: "/coach#activite-recente" },
    { title: "Groupes", url: "/coach#groupes" },
  ],
};

const ADMIN_NAV_ITEM: AppSidebarNavItem = {
  title: "Administration",
  url: "/admin",
  icon: ShieldCheck,
  accent: true,
  children: [
    { title: "Recherches", url: "/admin#recherches" },
    { title: "Coachs", url: "/admin#coachs" },
    { title: "Clés API", url: "/admin#cles-api" },
    { title: "Suppressions", url: "/admin#suppression-comptes" },
    { title: "Conformité", url: "/admin#conformite" },
    { title: "Audit", url: "/admin#audit" },
  ],
};

export const FOOTER_NAV_ITEMS: AppSidebarNavItem[] = [
  { title: "Confidentialité", url: "/privacy", icon: ShieldCheck },
];

export function getSidebarNavItems(role?: UserRole, isAuthenticated?: boolean): AppSidebarNavItem[] {
  let items = [...BASE_NAV_ITEMS];

  if (!isAuthenticated) {
    items = items.filter((item) => item.url !== "/scout");
  }

  if (role === "admin") {
    return [ADMIN_NAV_ITEM, COACH_NAV_ITEM, ...items];
  }

  if (role === "coach") {
    return [COACH_NAV_ITEM, ...items];
  }

  return items;
}

export function isSidebarItemActive(pathname: string, itemUrl: string) {
  return pathname === itemUrl;
}

export function isSidebarSubItemVisible(pathname: string, item: AppSidebarNavItem) {
  return pathname === item.url && Boolean(item.children?.length);
}

export function isSidebarSubItemActive(pathname: string, hash: string, itemUrl: string) {
  const [itemPath, itemAnchor] = itemUrl.split("#");

  if (pathname !== itemPath) {
    return false;
  }

  if (!itemAnchor) {
    return true;
  }

  return hash === `#${itemAnchor}`;
}
