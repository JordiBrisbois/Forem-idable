import { useMemo } from "react";
import { addDays, isAfter, isBefore } from "date-fns";
import {
  getDisplayApplicationStatus,
  isFollowUpEnabled,
  isFollowUpPending,
} from "@/features/applications/utils";
import { JobApplication } from "@/types/application";

export interface ApplicationDerivedState {
  followUpDue: Date;
  interviewDate: Date | null;
  hasInterview: boolean;
  followUpEnabled: boolean;
  isDue: boolean;
  isSoon: boolean;
  displayStatus: JobApplication["status"];
}

export function useApplicationDerivedState(
  application: JobApplication,
  now: Date
): ApplicationDerivedState {
  return useMemo(() => {
    const followUpDue = new Date(application.followUpDueAt);
    const interviewDate = application.interviewAt
      ? new Date(application.interviewAt)
      : null;
    const hasInterview =
      Boolean(interviewDate) && !Number.isNaN(interviewDate!.getTime());
    const followUpEnabled = isFollowUpEnabled(application);
    const isDue =
      isFollowUpPending(application.status) &&
      followUpEnabled &&
      !Number.isNaN(followUpDue.getTime()) &&
      !isAfter(followUpDue, now);
    const isSoon =
      isFollowUpPending(application.status) &&
      followUpEnabled &&
      !Number.isNaN(followUpDue.getTime()) &&
      isAfter(followUpDue, now) &&
      isBefore(followUpDue, addDays(now, 2));
    const displayStatus = getDisplayApplicationStatus(application, now);

    return {
      followUpDue,
      interviewDate,
      hasInterview,
      followUpEnabled,
      isDue,
      isSoon,
      displayStatus,
    };
  }, [application, now]);
}
