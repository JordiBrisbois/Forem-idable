import Link from "next/link";
import { runtimeConfig } from "@/config/runtime";

export function SiteFooter() {
  return (
    <footer className="border-t bg-background/95 lg:hidden">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 text-sm text-muted-foreground lg:px-8">
        <p>
          {runtimeConfig.brand.copyrightName} · {runtimeConfig.app.name} · {runtimeConfig.app.currentYear}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/privacy" className="underline-offset-4 hover:text-foreground hover:underline">
            Confidentialité
          </Link>
          <Link href="/about" className="underline-offset-4 hover:text-foreground hover:underline">
            À propos
          </Link>
          <a
            href={runtimeConfig.privacy.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            {runtimeConfig.app.sourceLinkLabel}
          </a>
        </div>
      </div>
    </footer>
  );
}
