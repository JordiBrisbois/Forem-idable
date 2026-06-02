export function getContractBadgeClass(contractType: string) {
  const normalizedType = contractType.toLowerCase();

  if (normalizedType.includes("cdi") || normalizedType.includes("indétermin")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300";
  }

  if (
    normalizedType.includes("cdd") ||
    normalizedType.includes("intérim") ||
    normalizedType.includes("interim") ||
    normalizedType.includes("temporaire")
  ) {
    return "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-800/60 dark:bg-cyan-950/30 dark:text-cyan-300";
  }

  if (normalizedType.includes("stage") || normalizedType.includes("alternance")) {
    return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800/60 dark:bg-violet-950/30 dark:text-violet-300";
  }

  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300";
}

export function getContractBadgeLabel(contractType: string) {
  const compact = contractType
    .replace(/\bavec\b/gi, "av.")
    .replace(/\boption\b/gi, "opt.")
    .replace(/\bdurée\b/gi, "dur.")
    .replace(/\bindéterminée?\b/gi, "indét.")
    .replace(/\bdéterminée?\b/gi, "dét.")
    .replace(/\bintérimaire\b/gi, "Intérim")
    .replace(/\binterimaire\b/gi, "Intérim")
    .replace(/\btemporaire\b/gi, "Temp.")
    .replace(/\s+/g, " ")
    .trim();

  return compact.length > 18 ? `${compact.slice(0, 15)}...` : compact;
}
