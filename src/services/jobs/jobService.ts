import { runtimeConfig } from "@/config/runtime";
import { normalizeContractType } from "@/lib/contractType";
import { ForemSearchParams } from '../api/foremClient';
import { Job } from '@/types/job';
import { adzunaProvider } from './providers/adzunaProvider';
import { foremProvider } from './providers/foremProvider';
import { JobProvider } from './providers/types';
import { dedupeAndSortJobs } from './utils/mergeJobs';

/**
 * Register the enabled job providers. The job-search module can be turned off
 * entirely (`FEATURE_JOB_SEARCH=false`) so the platform can be used purely for
 * coaching / class management. Add new sources here.
 */
const providers: JobProvider[] = [];

if (runtimeConfig.features.jobSearch) {
  providers.push(foremProvider, adzunaProvider);
}

/**
 * JobService acts as an abstraction layer across multiple potential job indexers.
 */
export const jobService = {
    searchJobs: async (params: ForemSearchParams): Promise<{ jobs: Job[]; total: number }> => {
        if (providers.length === 0) {
            return { jobs: [], total: 0 };
        }

        const results = await Promise.all(providers.map((provider) => provider.search(params)));

        const merged = dedupeAndSortJobs(results.flatMap((result) => result.jobs));

        // Contract-type filtering is done on normalized values so free-form
        // dataset labels ("Stage étudiant", "STAGE - 6 mois"…) still match.
        const contractTypes = params.contractTypes ?? [];
        const filtered = contractTypes.length > 0
            ? merged.filter((job) => contractTypes.includes(normalizeContractType(job.contractType)))
            : merged;

        return {
            jobs: filtered,
            total: filtered.length,
        };
    }
};
