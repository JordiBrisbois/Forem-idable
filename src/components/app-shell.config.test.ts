import { describe, expect, it } from "vitest";
import {
  FOOTER_NAV_ITEMS,
  getSidebarNavItems,
  isSidebarItemActive,
  isSidebarSubItemActive,
  isSidebarSubItemVisible,
} from "@/components/app-shell.config";

describe("app shell config", () => {
  it("adds role-specific navigation entries for coach and admin roles", () => {
    expect(getSidebarNavItems("user").map((item) => item.url)).toEqual([
      "/",
      "/applications",
      "/account",
      "/about",
    ]);

    expect(getSidebarNavItems("coach").map((item) => item.url)).toEqual([
      "/coach",
      "/",
      "/applications",
      "/account",
      "/about",
    ]);

    expect(getSidebarNavItems("admin").map((item) => item.url)).toEqual([
      "/admin",
      "/coach",
      "/",
      "/applications",
      "/account",
      "/about",
    ]);
  });

  it("marks only exact pathname matches as active and reveals coach subnav on the coach page", () => {
    const coachItem = getSidebarNavItems("coach")[0];

    expect(isSidebarItemActive("/applications", "/applications")).toBe(true);
    expect(isSidebarItemActive("/applications", "/account")).toBe(false);
    expect(isSidebarSubItemVisible("/coach", coachItem)).toBe(true);
    expect(isSidebarSubItemVisible("/applications", coachItem)).toBe(false);
    expect(isSidebarSubItemActive("/coach", "#groupes", "/coach#groupes")).toBe(true);
    expect(isSidebarSubItemActive("/coach", "#groupes", "/coach#activite-recente")).toBe(false);
  });

  it("exposes the privacy footer entry", () => {
    expect(FOOTER_NAV_ITEMS.map((item) => item.url)).toEqual(["/privacy"]);
  });
});
