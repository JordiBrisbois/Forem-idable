import { LucideIcon } from "lucide-react";

type AccountSectionHeaderProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function AccountSectionHeader({
  icon: Icon,
  title,
  description,
}: AccountSectionHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-primary/10 p-2 text-primary">
        <Icon />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
