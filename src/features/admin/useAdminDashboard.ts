"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { updateUserRoleInDashboard } from "@/features/coach/dashboardState";
import { CoachDashboardData } from "@/types/coach";
import { demoteCoachRole, fetchAdminDashboard, promoteCoachRole } from "@/features/admin/adminApi";

export function useAdminDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [dashboard, setDashboard] = useState<CoachDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPromoteCoachOpen, setIsPromoteCoachOpen] = useState(false);

  const isAuthorized = user?.role === "admin";

  const loadDashboard = useCallback(async () => {
    if (!isAuthorized) {
      setDashboard(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const { response, data } = await fetchAdminDashboard();

      if (!response.ok || !data.dashboard) {
        setDashboard(null);
        setFeedback(data.error || "Accès administration indisponible.");
        return;
      }

      setDashboard(data.dashboard);
    } catch {
      setDashboard(null);
      setFeedback("Accès administration indisponible.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthorized) {
      setDashboard(null);
      setIsLoading(false);
      return;
    }

    void loadDashboard();
  }, [isAuthLoading, isAuthorized, loadDashboard]);

  const promotableUsers = useMemo(
    () => dashboard?.users.filter((entry) => entry.role === "user") ?? [],
    [dashboard?.users]
  );

  const managedCoaches = useMemo(
    () => dashboard?.users.filter((entry) => entry.role === "coach") ?? [],
    [dashboard?.users]
  );

  const promoteCoach = useCallback(
    async (userId: number) => {
      const previousDashboard = dashboard;
      setDashboard((current) =>
        current ? updateUserRoleInDashboard(current, userId, "coach") : current
      );

      try {
        const { response, data } = await promoteCoachRole(userId);
        if (!response.ok) {
          setDashboard(previousDashboard);
          setFeedback(data.error || "Promotion coach impossible.");
          return false;
        }

        setIsPromoteCoachOpen(false);
        setFeedback("Utilisateur promu coach.");
        return true;
      } catch {
        setDashboard(previousDashboard);
        setFeedback("Promotion coach impossible.");
        return false;
      }
    },
    [dashboard]
  );

  const demoteCoach = useCallback(
    async (userId: number) => {
      const targetUser = dashboard?.users.find((entry) => entry.id === userId);
      if (!targetUser || (targetUser.role !== "coach" && targetUser.role !== "admin")) {
        setFeedback("Utilisateur introuvable.");
        return false;
      }

      const previousDashboard = dashboard;
      setDashboard((current) =>
        current ? updateUserRoleInDashboard(current, userId, "user") : current
      );

      try {
        const { response, data } = await demoteCoachRole(userId);
        if (!response.ok) {
          setDashboard(previousDashboard);
          setFeedback(data.error || "Retrait du rôle coach impossible.");
          return false;
        }

        setFeedback("Rôle coach retiré.");
        return true;
      } catch {
        setDashboard(previousDashboard);
        setFeedback("Retrait du rôle coach impossible.");
        return false;
      }
    },
    [dashboard]
  );

  return {
    user,
    isAuthLoading,
    isAuthorized,
    dashboard,
    isLoading,
    feedback,
    isPromoteCoachOpen,
    setIsPromoteCoachOpen,
    promotableUsers,
    managedCoaches,
    loadDashboard,
    promoteCoach,
    demoteCoach,
  };
}
