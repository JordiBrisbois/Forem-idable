import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ContentPageHeaderProps = {
  badges: Array<{ label: string; variant?: "default" | "secondary" | "destructive" | "outline" }>;
  title: string;
  description: string;
};

export function ContentPageHeader({
  badges,
  title,
  description,
}: ContentPageHeaderProps) {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {badges.map((badge) => (
            <Badge key={badge.label} variant={badge.variant ?? "outline"}>
              {badge.label}
            </Badge>
          ))}
        </div>
        <CardTitle className="text-3xl font-black tracking-tight">{title}</CardTitle>
        <CardDescription className="max-w-3xl text-base">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

type ContentSectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ContentSectionCard({
  title,
  description,
  children,
  className,
  contentClassName,
}: ContentSectionCardProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
