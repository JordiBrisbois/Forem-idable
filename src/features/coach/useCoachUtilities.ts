"use client";

import { useCallback } from "react";
import {
  CoachApplicationExportRow,
  exportCoachApplicationsToCSV,
} from "@/lib/exportCoachApplicationsCsv";
import { requestCalendarSubscription as requestCalendarSubscriptionApi } from "@/features/coach/coachDashboardApi";
import { CalendarSubscriptionSummary } from "@/types/calendar";
import { CoachCalendarRegenerationTarget } from "@/features/coach/types";
import { CoachUserSummary } from "@/types/coach";
import {
  buildGroupExportRows,
  buildUserExportRows,
} from "@/features/coach/utils";

export function useCoachUtilities(input: {
  calendarRegenerationTarget: CoachCalendarRegenerationTarget | null;
  selectedUser: CoachUserSummary | null;
  setCalendarRegenerationTarget: (target: CoachCalendarRegenerationTarget | null) => void;
  setFeedback: (value: string | null) => void;
}) {
  const exportRows = useCallback((filenamePrefix: string, rows: CoachApplicationExportRow[]) => {
    exportCoachApplicationsToCSV({
      filenamePrefix,
      rows,
    });
  }, []);

  const buildAbsoluteCalendarUrl = useCallback((subscription: CalendarSubscriptionSummary) => {
    if (typeof window === "undefined") {
      return subscription.path;
    }

    return `${window.location.origin}${subscription.path}`;
  }, []);

  const writeCalendarUrl = useCallback(
    async (subscription: CalendarSubscriptionSummary, label: string, actionLabel: string) => {
      const absoluteUrl = buildAbsoluteCalendarUrl(subscription);

      try {
        await navigator.clipboard.writeText(absoluteUrl);
        input.setFeedback(`${actionLabel} : ${label}.`);
        return true;
      } catch {
        input.setFeedback(`Calendrier prêt, mais copie impossible: ${label}.`);
        return false;
      }
    },
    [buildAbsoluteCalendarUrl, input]
  );

  const requestCalendarSubscription = useCallback(
    async (params: {
      scope: "group" | "all_groups";
      groupId?: number | null;
      regenerate?: boolean;
      label: string;
    }) => {
      const { response, data } = await requestCalendarSubscriptionApi({
        scope: params.scope,
        groupId: params.groupId,
        regenerate: params.regenerate,
      });

      if (!response.ok || !data.subscription) {
        input.setFeedback(data.error || "Calendrier indisponible.");
        return false;
      }

      await writeCalendarUrl(
        data.subscription,
        params.label,
        params.regenerate
          ? "Nouvelle URL calendrier régénérée et copiée"
          : "Nouvelle URL calendrier copiée"
      );
      return true;
    },
    [input, writeCalendarUrl]
  );

  const exportUserApplications = useCallback(() => {
    if (!input.selectedUser) return;

    const rows = buildUserExportRows(input.selectedUser);
    exportRows(
      `candidatures-${input.selectedUser.email.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
      rows
    );

    if (input.selectedUser.applications.length === 0) {
      input.setFeedback("Export généré avec une ligne vide: aucune candidature pour cet utilisateur.");
    }
  }, [exportRows, input]);

  const exportGroupApplications = useCallback(
    (groupName: string, members: CoachUserSummary[]) => {
      const rows = buildGroupExportRows(groupName, members);
      exportRows(`groupe-${groupName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`, rows);

      if (members.every((entry) => entry.applications.length === 0)) {
        input.setFeedback("Export généré avec des lignes vides: aucune candidature dans ce groupe.");
      }
    },
    [exportRows, input]
  );

  const copyGroupCalendarUrl = useCallback(
    async (groupId: number, groupName: string) =>
      requestCalendarSubscription({
        scope: "group",
        groupId,
        label: `groupe ${groupName}`,
      }),
    [requestCalendarSubscription]
  );

  const copyAllGroupsCalendarUrl = useCallback(
    async () =>
      requestCalendarSubscription({
        scope: "all_groups",
        label: "tous les groupes bénéficiaires",
      }),
    [requestCalendarSubscription]
  );

  const regenerateCalendarUrl = useCallback(async () => {
    if (!input.calendarRegenerationTarget) return;

    const success = await requestCalendarSubscription({
      scope: input.calendarRegenerationTarget.scope,
      groupId: input.calendarRegenerationTarget.groupId,
      regenerate: true,
      label: input.calendarRegenerationTarget.label,
    });

    if (success) {
      input.setCalendarRegenerationTarget(null);
    }
  }, [input, requestCalendarSubscription]);

  return {
    copyAllGroupsCalendarUrl,
    copyGroupCalendarUrl,
    exportGroupApplications,
    exportUserApplications,
    regenerateCalendarUrl,
  };
}
