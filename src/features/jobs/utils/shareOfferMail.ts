import { runtimeConfig } from "@/config/runtime";
import { getJobExternalUrl } from "@/features/jobs/utils/jobLinks";
import { Job } from "@/types/job";

export function buildOfferMailtoLink(job: Job, publicationLabel: string): string {
  const jobUrl = getJobExternalUrl(job);
  const emailSubject = `Offre à découvrir: ${job.title}`;
  const emailBody = [
    "Bonjour,",
    "",
    "Je te partage cette offre d'emploi:",
    "",
    `Intitulé: ${job.title}`,
    `Entreprise: ${job.company || "Non précisée"}`,
    `Localité: ${job.location}`,
    `Contrat: ${job.contractType}`,
    `Publication: ${publicationLabel}`,
    "",
    `Lien de l'offre: ${jobUrl}`,
    "",
    `Envoyé depuis ${runtimeConfig.app.name}`,
  ].join("\n");

  return `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
}
