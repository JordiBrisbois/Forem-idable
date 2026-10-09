import { runtimeConfig } from "@/config/runtime";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className }: AppLogoProps) {
  const appName = runtimeConfig.app.name;
  const { logoUrl, monogram } = runtimeConfig.brand;

  if (logoUrl) {
    return (
      <div className={cn("inline-flex h-full items-center", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={appName} className="h-full w-auto object-contain" />
      </div>
    );
  }

  if (monogram) {
    return (
      <div className={cn("inline-flex h-full items-center gap-2.5", className)}>
        <span className="flex h-full aspect-square items-center justify-center rounded-lg bg-primary text-primary-foreground [font-family:var(--font-logo)] text-sm font-bold">
          {monogram.slice(0, 3)}
        </span>
        <span className="[font-family:var(--font-logo)] text-[1.2rem] font-bold tracking-[-0.05em] text-foreground">
          {appName}
        </span>
      </div>
    );
  }

  const [, leadingSegment = appName, trailingSegment = ""] =
    appName.match(/^(.*?)(-.+)$/) ?? [];

  return (
    <div className={cn("inline-flex h-full items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        className="h-full w-auto shrink-0 overflow-visible"
      >
        <rect x="3" y="4" width="10" height="32" rx="4" className="fill-foreground" />
        <rect x="14.5" y="4" width="21" height="8" rx="4" className="fill-foreground" />
        <rect x="14.5" y="16" width="16" height="8" rx="4" className="fill-primary" />
        <rect x="14.5" y="28" width="11" height="8" rx="4" className="fill-foreground/22" />
      </svg>
      <span className="flex items-end leading-none">
        <span className="[font-family:var(--font-logo)] text-[1.32rem] font-bold tracking-[-0.065em] text-foreground">
          {leadingSegment}
        </span>
        {trailingSegment ? (
          <span className="[font-family:var(--font-logo)] ml-[0.05em] text-[1.02rem] font-semibold tracking-[-0.06em] text-primary">
            {trailingSegment}
          </span>
        ) : null}
      </span>
    </div>
  );
}
