"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createScoutJob,
  deleteScoutJob,
  getScoutJob,
  listScoutJobs,
  openScoutStream,
} from "../scoutApi";
import { ScoutJob, ScoutJobCreateInput, ScoutProgressEvent, ScoutResult } from "../scoutSchemas";

export function useScoutPageState() {
  const [jobs, setJobs] = useState<ScoutJob[]>([]);
  const [activeJob, setActiveJob] = useState<ScoutJob | null>(null);
  const [results, setResults] = useState<ScoutResult[]>([]);
  const [isLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ step: number; total: number; found: number; message?: string } | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      const data = await listScoutJobs();
      setJobs(data.jobs);
    } catch {
      // silent fail for history
    }
  }, []);

  const loadJobDetail = useCallback(async (jobId: number) => {
    try {
      const data = await getScoutJob(jobId);
      setActiveJob(data.job);
      setResults(data.results);
    } catch {
      toast.error("Chargement du job impossible.");
    }
  }, []);

  const startJob = useCallback(async (input: ScoutJobCreateInput) => {
    setIsSubmitting(true);
    try {
      const { jobId } = await createScoutJob(input);

      // Start SSE stream immediately so the job actually runs
      const es = openScoutStream(jobId);
      setProgress({ step: 0, total: 1, found: 0 });

      es.onmessage = (event) => {
        const data: ScoutProgressEvent = JSON.parse(event.data);
        if (data.type === "progress") {
          setProgress({
            step: data.step ?? 0,
            total: data.total ?? 1,
            found: data.found ?? 0,
            message: data.message,
          });
          if (data.found && data.found > 0) {
            // Refresh results periodically
            getScoutJob(jobId).then((d) => setResults(d.results)).catch(() => {});
          }
        } else if (data.type === "completed") {
          setProgress(null);
          getScoutJob(jobId).then((d) => {
            setActiveJob(d.job);
            setResults(d.results);
          }).catch(() => {});
          toast.success(`Recherche terminée — ${data.resultCount} résultats.`);
          loadJobs();
          es.close();
        } else if (data.type === "error") {
          setProgress(null);
          toast.error(data.message || "Échec de la recherche.");
          loadJobs();
          es.close();
        }
      };

      es.onerror = () => {
        setProgress(null);
        es.close();
      };

      // Refresh history and job detail in background (don't block stream)
      loadJobs().catch(() => {});
      loadJobDetail(jobId).catch(() => {});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec du lancement.");
    } finally {
      setIsSubmitting(false);
    }
  }, [loadJobs, loadJobDetail]);

  const removeJob = useCallback(async (jobId: number) => {
    try {
      await deleteScoutJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      if (activeJob?.id === jobId) {
        setActiveJob(null);
        setResults([]);
      }
      toast.success("Job supprimé.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible.");
    }
  }, [activeJob]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return {
    jobs,
    activeJob,
    results,
    isLoading,
    isSubmitting,
    progress,
    isHistoryOpen,
    startJob,
    loadJobDetail,
    removeJob,
    openHistory: () => setIsHistoryOpen(true),
    closeHistory: () => setIsHistoryOpen(false),
  };
}
