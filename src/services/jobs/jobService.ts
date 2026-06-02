import { ForemSearchParams } from '../api/foremClient';
import { Job } from '@/types/job';
import { adzunaProvider } from './providers/adzunaProvider';
import { foremProvider } from './providers/foremProvider';
import { JobProvider } from './providers/types';
import { dedupeAndSortJobs } from './utils/mergeJobs';

const providers: JobProvider[] = [foremProvider, adzunaProvider];

/**
 * JobService acts as an abstraction layer across multiple potential job indexers.
 */
export const jobService = {
    searchJobs: async (params: ForemSearchParams): Promise<{ jobs: Job[]; total: number }> => {
        const results = await Promise.all(providers.map((provider) => provider.search(params)));

        const merged = dedupeAndSortJobs(results.flatMap((result) => result.jobs));

        return {
            jobs: merged,
            total: merged.length,
        };
    }
};
