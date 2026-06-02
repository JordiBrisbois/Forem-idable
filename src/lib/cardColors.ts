/**
 * Palette partagée pour les cartes de statut et les statistiques.
 * Alignée sur les variantes de Badge (info, success, error, warning, primary).
 * Usage : ApplicationCard, CoachUserApplicationCard, CoachStatGrid, etc.
 */

export interface StatusCardClasses {
  border: string;
  bg: string;
  text: string;
  hoverBorder: string;
  hoverBg: string;
  darkBorder: string;
  darkBg: string;
  darkText: string;
  darkHoverBorder: string;
  darkHoverBg: string;
}

const INFO: StatusCardClasses = {
  border: "border-[#9FCAE8]",
  bg: "bg-[#EEF6FC]",
  text: "text-[#2E6E99]",
  hoverBorder: "hover:border-[#87BADF]",
  hoverBg: "hover:bg-[#E3F0FA]",
  darkBorder: "dark:border-[#2A5573]",
  darkBg: "dark:bg-[#10202B]",
  darkText: "dark:text-[#9FCAE8]",
  darkHoverBorder: "dark:hover:border-[#3A6C8E]",
  darkHoverBg: "dark:hover:bg-[#152B39]",
};

const SUCCESS: StatusCardClasses = {
  border: "border-[#9BD7A1]",
  bg: "bg-[#EEF9F0]",
  text: "text-[#2F7A3E]",
  hoverBorder: "hover:border-[#7FC788]",
  hoverBg: "hover:bg-[#E5F5E8]",
  darkBorder: "dark:border-[#245A31]",
  darkBg: "dark:bg-[#12261A]",
  darkText: "dark:text-[#9BD7A1]",
  darkHoverBorder: "dark:hover:border-[#357A45]",
  darkHoverBg: "dark:hover:bg-[#173120]",
};

const ERROR: StatusCardClasses = {
  border: "border-[#F3A19B]",
  bg: "bg-[#FFF0EE]",
  text: "text-[#C85A50]",
  hoverBorder: "hover:border-[#E78D86]",
  hoverBg: "hover:bg-[#FEE4E0]",
  darkBorder: "dark:border-[#6E3531]",
  darkBg: "dark:bg-[#2C1715]",
  darkText: "dark:text-[#F3A19B]",
  darkHoverBorder: "dark:hover:border-[#8A4742]",
  darkHoverBg: "dark:hover:bg-[#351C19]",
};

const WARNING: StatusCardClasses = {
  border: "border-[#F2C27A]",
  bg: "bg-[#FFF5E8]",
  text: "text-[#A46110]",
  hoverBorder: "hover:border-[#E6B35E]",
  hoverBg: "hover:bg-[#FDEED8]",
  darkBorder: "dark:border-[#6D4B1E]",
  darkBg: "dark:bg-[#2A1D0F]",
  darkText: "dark:text-[#F2C27A]",
  darkHoverBorder: "dark:hover:border-[#8A6027]",
  darkHoverBg: "dark:hover:bg-[#352514]",
};

const PRIMARY: StatusCardClasses = {
  border: "border-[#B8C5E0]",
  bg: "bg-[#EFF2F8]",
  text: "text-[#3B5A8A]",
  hoverBorder: "hover:border-[#A0B0D0]",
  hoverBg: "hover:bg-[#E5EBF5]",
  darkBorder: "dark:border-[#2A3B5A]",
  darkBg: "dark:bg-[#121A2B]",
  darkText: "dark:text-[#8BA0C8]",
  darkHoverBorder: "dark:hover:border-[#3A4F75]",
  darkHoverBg: "dark:hover:bg-[#182236]",
};

function toClassString(c: StatusCardClasses): string {
  return `${c.border} ${c.bg} ${c.hoverBorder} ${c.hoverBg} ${c.darkBorder} ${c.darkBg} ${c.darkHoverBorder} ${c.darkHoverBg}`;
}

export function getStatusCardColors(
  tone: "info" | "success" | "error" | "warning" | "primary"
): StatusCardClasses {
  switch (tone) {
    case "info":
      return INFO;
    case "success":
      return SUCCESS;
    case "error":
      return ERROR;
    case "warning":
      return WARNING;
    case "primary":
      return PRIMARY;
  }
}

/**
 * Retourne les classes Tailwind complètes pour une carte de statut.
 */
export function getStatusCardClasses(
  status: string,
  isDue: boolean,
  hasInterview: boolean,
  hasUnreadCoachUpdate?: boolean
): string {
  if (hasUnreadCoachUpdate) {
    return toClassString(PRIMARY);
  }
  if (status === "interview" || hasInterview) {
    return toClassString(INFO);
  }
  if (status === "accepted") {
    return toClassString(SUCCESS);
  }
  if (status === "rejected") {
    return toClassString(ERROR);
  }
  if (isDue) {
    return toClassString(WARNING);
  }
  return "";
}

/**
 * Retourne la variante de Badge pour un statut de candidature.
 */
export function getApplicationStatusBadgeVariant(
  status: string,
  isDue: boolean,
  hasInterview: boolean
): "success" | "error" | "info" | "warning" | "secondary" {
  if (status === "accepted") return "success";
  if (status === "rejected") return "error";
  if (status === "interview" || hasInterview) return "info";
  if (isDue) return "warning";
  return "secondary";
}
