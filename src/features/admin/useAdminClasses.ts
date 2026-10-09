"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  addCoachGroupCoach,
  addCoachGroupMember,
  archiveCoachGroup,
  createCoachGroup,
  removeCoachGroupMember,
} from "@/lib/api/coachGroups";
import { createBeneficiaryAccount } from "@/features/admin/adminApi";
import { SearchGoal } from "@/types/preferences";

interface ApiResult {
  response: Response;
  data: { error?: string };
}

interface UseAdminClassesOptions {
  refresh: () => Promise<void> | void;
}

export function useAdminClasses({ refresh }: UseAdminClassesOptions) {
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isCreatingBeneficiary, setIsCreatingBeneficiary] = useState(false);

  const runAction = useCallback(
    async (action: () => Promise<ApiResult>, successMessage: string) => {
      try {
        const { response, data } = await action();
        if (!response.ok) {
          toast.error(data.error || "Action impossible.");
          return false;
        }
        toast.success(successMessage);
        await refresh();
        return true;
      } catch {
        toast.error("Action impossible.");
        return false;
      }
    },
    [refresh]
  );

  const createClass = useCallback(
    async (name: string) => {
      setIsCreatingClass(true);
      const ok = await runAction(() => createCoachGroup(name), "Classe créée.");
      setIsCreatingClass(false);
      return ok;
    },
    [runAction]
  );

  const addMember = useCallback(
    async (groupId: number, userId: number) =>
      runAction(() => addCoachGroupMember(groupId, userId), "Bénéficiaire ajouté à la classe."),
    [runAction]
  );

  const removeMember = useCallback(
    async (groupId: number, userId: number) =>
      runAction(
        () => removeCoachGroupMember(groupId, userId),
        "Bénéficiaire retiré de la classe."
      ),
    [runAction]
  );

  const assignCoach = useCallback(
    async (groupId: number, coachUserId: number) =>
      runAction(() => addCoachGroupCoach(groupId, coachUserId), "Coach assigné à la classe."),
    [runAction]
  );

  const archiveClass = useCallback(
    async (groupId: number, archived: boolean) =>
      runAction(
        () => archiveCoachGroup(groupId, archived),
        archived ? "Classe archivée." : "Classe réactivée."
      ),
    [runAction]
  );

  const createAndAddBeneficiary = useCallback(
    async (
      groupId: number,
      input: { email: string; firstName: string; lastName: string; searchGoal?: SearchGoal }
    ) => {
      setIsCreatingBeneficiary(true);
      try {
        const { response, data } = await createBeneficiaryAccount(input);

        if (!response.ok || !data.user) {
          toast.error(data.error || "Création du bénéficiaire impossible.");
          return false;
        }

        const addResult = await addCoachGroupMember(groupId, data.user.id);
        if (!addResult.response.ok) {
          toast.error(addResult.data.error || "Bénéficiaire créé mais non ajouté à la classe.");
          return false;
        }

        toast.success("Bénéficiaire créé et ajouté à la classe.");
        await refresh();
        return true;
      } catch {
        toast.error("Création du bénéficiaire impossible.");
        return false;
      } finally {
        setIsCreatingBeneficiary(false);
      }
    },
    [refresh]
  );

  return {
    isCreatingClass,
    isCreatingBeneficiary,
    createClass,
    addMember,
    removeMember,
    assignCoach,
    archiveClass,
    createAndAddBeneficiary,
  };
}
