interface CoachStatGridProps {
  applicationCount: number;
  interviewCount: number;
  dueCount: number;
  acceptedCount: number;
  rejectedCount: number;
  className?: string;
}

export function CoachStatGrid({
  applicationCount,
  interviewCount,
  dueCount,
  acceptedCount,
  rejectedCount,
  className,
}: CoachStatGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-1.5 sm:gap-2 ${className ?? ""}`}>
      <StatCell label="Candidatures" value={applicationCount} tone="neutral" />
      <StatCell label="Entretiens" value={interviewCount} tone="info" />
      <StatCell label="Relances" value={dueCount} tone="warning" />
      <StatResultCell accepted={acceptedCount} rejected={rejectedCount} />
    </div>
  );
}

function StatCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "info" | "warning";
}) {
  const styles =
    tone === "info"
      ? "border-[#9FCAE8] bg-[#EEF6FC] dark:border-[#2A5573] dark:bg-[#10202B]"
      : tone === "warning"
        ? "border-[#F2C27A] bg-[#FFF5E8] dark:border-[#6D4B1E] dark:bg-[#2A1D0F]"
        : "border-border/60 bg-muted/10";

  const textStyles =
    tone === "info"
      ? "text-[#2E6E99] dark:text-sky-300"
      : tone === "warning"
        ? "text-[#A46110] dark:text-amber-300"
        : "text-foreground";

  return (
    <div
      className={`rounded-lg border px-2.5 py-2 text-center sm:px-3 ${styles}`}
    >
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`text-sm font-semibold ${textStyles}`}>{value}</p>
    </div>
  );
}

function StatResultCell({
  accepted,
  rejected,
}: {
  accepted: number;
  rejected: number;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background px-2.5 py-2 text-center sm:px-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        Résultats
      </p>
      <div className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground">
        <span className="text-[#2F7A3E] dark:text-emerald-300">{accepted}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-[#C85A50] dark:text-rose-300">{rejected}</span>
      </div>
    </div>
  );
}
