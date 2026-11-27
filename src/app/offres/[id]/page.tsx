import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContractTypeBadge } from "@/components/jobs/ContractTypeBadge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OfferDetailView } from "@/features/jobs/components/offer-panel/OfferDetailView";
import { getJobExternalUrl } from "@/features/jobs/utils/jobLinks";
import { runtimeConfig } from "@/config/runtime";
import { getOfferDetail } from "@/lib/server/offers/detailService";
import { getOfferJob } from "@/lib/server/offers/repository";
import { buildJobPostingJsonLd } from "@/lib/seo/jobPosting";
import { siteBaseUrl } from "@/lib/siteUrl";
import type { Job } from "@/types/job";
import type { OfferDetails } from "@/types/offerDetails";

export const dynamic = "force-dynamic";


function plainDescription(job: Job, details: OfferDetails | null): string {
  const raw = details?.description || job.description || "";
  return raw.replace(/\s+/g, " ").trim();
}

function excerpt(text: string, max = 155): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

async function loadOffer(id: string) {
  const [job, details] = await Promise.all([getOfferJob(id), getOfferDetail(id)]);
  return { job, details };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { job, details } = await loadOffer(id).catch(() => ({ job: null, details: null }));

  if (!job) {
    return { title: `Offre introuvable — ${runtimeConfig.app.name}`, robots: { index: false } };
  }

  const description = excerpt(plainDescription(job, details));
  const canonical = `${siteBaseUrl()}/offres/${id}`;

  return {
    title: `${job.title} — ${job.company || "Belgique"} | ${runtimeConfig.app.name}`,
    description,
    alternates: { canonical },
    openGraph: {
      title: job.title,
      description,
      url: canonical,
      type: "article",
      siteName: runtimeConfig.app.name,
    },
    twitter: { card: "summary", title: job.title, description },
    robots: { index: true, follow: true },
  };
}

export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { job, details } = await loadOffer(id);

  if (!job) notFound();

  const description = plainDescription(job, details);
  const jsonLd = buildJobPostingJsonLd({
    job,
    details,
    url: `${siteBaseUrl()}/offres/${id}`,
    description: description || job.title,
  });
  const externalUrl = getJobExternalUrl(job);

  return (
    <TooltipProvider delayDuration={120}>
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/">
            <ArrowLeft data-icon="inline-start" />
            Revenir à la recherche
          </Link>
        </Button>
        <Button asChild size="sm" className="w-fit">
          <a href={externalUrl} target="_blank" rel="noreferrer">
            Postuler sur le Forem
            <ExternalLink data-icon="inline-end" />
          </a>
        </Button>
      </div>

      <header className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {job.source === "forem" ? "Offre du Forem" : `Offre ${job.source}`}
        </p>
        <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
          {job.title}
        </h1>
        <p className="text-muted-foreground">
          {job.company || "Entreprise non précisée"} • {job.location}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <ContractTypeBadge contractType={job.contractType} />
          <Badge variant="secondary">{job.source.toUpperCase()}</Badge>
          {job.publicationDate ? (
            <Badge variant="outline">
              Publiée le {new Date(job.publicationDate).toLocaleDateString("fr-BE")}
            </Badge>
          ) : null}
        </div>
      </header>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <OfferDetailView job={job} details={details} />
      </div>

      <p className="text-xs text-muted-foreground">
        Le détail de l&apos;offre est repris du Forem ; la candidature se fait sur son site
        officiel. Les données sont rafraîchies automatiquement.
      </p>

      <script
        type="application/ld+json"
        // Our own object, serialised: escaping `<` keeps it from closing the tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </div>
    </TooltipProvider>
  );
}
