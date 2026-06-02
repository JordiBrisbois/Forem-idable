import { formatMessageDateSeparator } from "@/features/messages/messages.utils";

interface DateSeparatorProps {
  date: Date;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const label = formatMessageDateSeparator(date);

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-border/50" />
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}
