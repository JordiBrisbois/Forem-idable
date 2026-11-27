"use client";

import { ForemDataAttribution } from "@/features/jobs/components/ForemDataAttribution";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job } from "@/types/job";
import type { OfferDetails } from "@/types/offerDetails";

export function hasAdaptedForemContent(job: Job, details: OfferDetails | null): boolean {
  if (!details || job.source !== "forem") return false;

  return Boolean(
    details.sections.length > 0 ||
      details.highlights.length > 0 ||
      (details.description && details.description !== job.description)
  );
}

/**
 * The offer text itself: description, key facts, structured sections.
 *
 * Shared by the side panel and the public offer page so the two can never drift
 * apart; only the surrounding chrome (sheet header vs page header) differs.
 */
export function OfferDetailView({
  job,
  details,
}: {
  job: Job;
  details: OfferDetails | null;
}) {
  const description = details?.description || job.description;
  const showAttribution = job.source === "forem";

  return (
    <div className="flex flex-col gap-5">
      {description ? (
        <p className="whitespace-pre-wrap leading-6 text-foreground/90">{description}</p>
      ) : (
        <p className="text-muted-foreground">
          Aucune description détaillée disponible pour cette offre.
        </p>
      )}

      {details?.highlights && details.highlights.length > 0 ? (
        <section
          aria-labelledby="offer-highlights"
          className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-muted/20 p-4"
        >
          <h3 id="offer-highlights" className="font-semibold text-foreground">
            Informations complémentaires
          </h3>
          <dl className="flex flex-col gap-1.5">
            {details.highlights.map((item) => (
              <div key={`${item.label}-${item.value}`} className="text-xs leading-5">
                <dt className="inline font-semibold text-foreground">{item.label} : </dt>
                <dd className="inline text-foreground/85">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {details?.sections.map((section) => (
        <section
          key={`${section.title}-${section.content.slice(0, 20)}`}
          className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm"
        >
          <h3 className="font-semibold text-foreground">{section.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
            {section.content}
          </p>
        </section>
      ))}

      {showAttribution ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4">
          <ForemDataAttribution adapted={hasAdaptedForemContent(job, details)} />
        </div>
      ) : null}
    </div>
  );
}

export function OfferDetailSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-10/12" />
      <Skeleton className="h-4 w-9/12" />
      <Skeleton className="mt-2 h-24 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
    </div>
  );
}
