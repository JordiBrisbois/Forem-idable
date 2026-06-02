"use client";

import Link from "next/link";
import { ForemIdableLogo } from "@/components/branding/ForemIdableLogo";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur lg:hidden">
      <SidebarTrigger />
      <Link href="/" className="ml-4 inline-flex items-center">
        <ForemIdableLogo className="h-7" />
      </Link>
    </header>
  );
}
