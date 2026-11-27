import { runtimeConfig } from "@/config/runtime";
import { normalizeContractType } from "@/lib/contractType";
import { JobSearchParams } from "./searchParams";
import { Job } from '@/types/job';
import { adzunaProvider } from './providers/adzunaProvider';
import { foremProvider } from './providers/foremProvider';
import { JobProvider } from './providers/types';
import { mergeUniqueJobs } from './utils/mergeJobs';

/**
 * Register the enabled job providers. The job-search module can be turned off
 * entirely (`FEATURE_JOB_SEARCH=false`) so the platform can be used purely for
 * coaching / class management. Add new sources here.
 */
const providers: JobProvider[] = [];

if (runtimeConfig.features.jobSearch) {
  providers.push(foremProvider, adzunaProvider);
}

/** Adzuna is a bonus source: it has no offset support, so it only joins page 1. */
const SECONDARY_PAGE_SIZE = 20;

/**
 * JobService acts as an abstraction layer across multiple potential job indexers.
 *
 * The Forem mirror is the primary source and owns pagination, ordering and
 * filtering. A secondary provider is merged into the first page only, because its
 * API cannot paginate in step with ours; the total comes from the primary source
 * so the pager stays coherent.
 */
export const jobService = {
    searchJobs: async (params: JobSearchParams): Promise<{ jobs: Job[]; total: number }> => {
        if (providers.length === 0) {
            return { jobs: [], total: 0 };
        }

        const primary = await foremProvider.search(params);
        const isFirstPage = (params.offset ?? 0) === 0;

        let jobs = primary.jobs;

        if (isFirstPage) {
            try {
                const secondary = await adzunaProvider.search({
                    ...params,
                    limit: SECONDARY_PAGE_SIZE,
                    offset: 0,
                });
                jobs = mergeUniqueJobs([...primary.jobs, ...secondary.jobs]);
            } catch {
                // A bonus source must never break the primary one.
            }
        }

        // Contract-type filtering is done on normalized values so free-form
        // dataset labels ("Stage étudiant", "STAGE - 6 mois"…) still match.
        const contractTypes = params.contractTypes ?? [];
        const filtered = contractTypes.length > 0
            ? jobs.filter((job) => contractTypes.includes(normalizeContractType(job.contractType)))
            : jobs;

        return {
            jobs: filtered,
            total: primary.total,
        };
    }
};
