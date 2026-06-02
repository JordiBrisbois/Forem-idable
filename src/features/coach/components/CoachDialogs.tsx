"use client";

import { UserPickerDialog } from "@/components/coach/UserPickerDialog";
import { CoachApiKeysDialog } from "@/features/coach/components/dialogs/CoachApiKeysDialog";
import { CoachConfirmationDialog } from "@/features/coach/components/dialogs/CoachConfirmationDialog";
import { CoachCreateGroupDialog } from "@/features/coach/components/dialogs/CoachCreateGroupDialog";
import { CoachEditUserDialog } from "@/features/coach/components/dialogs/CoachEditUserDialog";
import { CoachPageState } from "@/features/coach/useCoachPageState";

interface CoachDialogsProps {
  page: CoachPageState;
}

export function CoachDialogs({ page }: CoachDialogsProps) {
  return (
    <>
      <CoachCreateGroupDialog
        open={page.isCreateGroupOpen}
        groupName={page.groupName}
        onOpenChange={page.setIsCreateGroupOpen}
        onGroupNameChange={page.setGroupName}
        onCreateGroup={() => void page.createGroup()}
      />

      <UserPickerDialog
        open={Boolean(page.memberPickerGroup)}
        onOpenChange={(open) => !open && page.setMemberPickerGroupId(null)}
        title={
          page.memberPickerGroup
            ? `Ajouter une personne à ${page.memberPickerGroup.name}`
            : "Ajouter une personne"
        }
        description="Recherche dynamique parmi toutes les personnes disponibles."
        users={page.assignableUsers}
        onSelect={(entry) =>
          void page.addMember(page.memberPickerGroup?.id ?? 0, entry.id)
        }
      />

      <UserPickerDialog
        open={Boolean(page.coachPickerGroup)}
        onOpenChange={(open) => !open && page.setCoachPickerGroupId(null)}
        title={
          page.coachPickerGroup
            ? `Attribuer un coach à ${page.coachPickerGroup.name}`
            : "Attribuer un coach"
        }
        description="Recherche parmi les comptes coach disponibles."
        users={page.assignableCoaches}
        onSelect={(entry) =>
          void page.addCoach(page.coachPickerGroup?.id ?? 0, entry.id)
        }
      />

      <UserPickerDialog
        open={Boolean(page.managerPickerGroup)}
        onOpenChange={(open) => !open && page.setManagerPickerGroupId(null)}
        title={
          page.managerPickerGroup
            ? `Définir le manager de ${page.managerPickerGroup.name}`
            : "Définir le manager"
        }
        description="Le manager doit être un coach déjà attribué à ce groupe."
        users={page.assignableManagers}
        onSelect={(entry) =>
          void page.setGroupManager(page.managerPickerGroup?.id ?? 0, entry.id)
        }
      />

      <CoachConfirmationDialog
        open={Boolean(page.removeMembership)}
        title="Retirer du groupe ?"
        description={
          page.removeMembership
            ? `${page.removeMembership.userEmail} sera retiré de ${page.removeMembership.groupName}.`
            : "Cet utilisateur sera retiré du groupe."
        }
        confirmLabel="Retirer"
        onOpenChange={(open) => !open && page.setRemoveMembership(null)}
        onConfirm={() => {
          if (!page.removeMembership) return;
          void page.removeMember(
            page.removeMembership.groupId,
            page.removeMembership.userId
          );
          page.setRemoveMembership(null);
        }}
      />

      <CoachConfirmationDialog
        open={Boolean(page.removeCoach)}
        title="Retirer ce coach du groupe ?"
        description={
          page.removeCoach
            ? `${page.removeCoach.userEmail} ne sera plus attribué à ${page.removeCoach.groupName}.`
            : "Ce coach ne sera plus attribué au groupe."
        }
        confirmLabel="Retirer"
        onOpenChange={(open) => !open && page.setRemoveCoach(null)}
        onConfirm={() => {
          if (!page.removeCoach) return;
          void page.removeAssignedCoach(
            page.removeCoach.groupId,
            page.removeCoach.userId
          );
          page.setRemoveCoach(null);
        }}
      />

      <CoachConfirmationDialog
        open={Boolean(page.removeGroup)}
        title="Supprimer ce groupe ?"
        description={
          page.removeGroup
            ? `Le groupe ${page.removeGroup.groupName} sera supprimé avec ses affectations.`
            : "Le groupe sera supprimé."
        }
        confirmLabel="Supprimer"
        isPending={page.isDeletingGroup}
        onOpenChange={(open) => !open && page.setRemoveGroup(null)}
        onConfirm={() => {
          if (!page.removeGroup || page.isDeletingGroup) return;
          void page.deleteGroup(page.removeGroup.groupId);
          page.setRemoveGroup(null);
        }}
      />

      <CoachEditUserDialog
        editTarget={page.editTarget}
        form={page.managedUserForm}
        onOpenChange={page.handleManagedUserDialogChange}
        onSubmit={page.submitManagedUserEdit}
      />

      <CoachApiKeysDialog
        apiKeysTarget={page.apiKeysTarget}
        apiKeys={page.managedApiKeys}
        apiKeysFeedback={page.apiKeysFeedback}
        isApiKeysLoading={page.isApiKeysLoading}
        onOpenChange={page.resetApiKeysDialog}
        onRequestRevokeApiKey={page.requestRevokeApiKey}
      />

      <CoachConfirmationDialog
        open={Boolean(page.revokeApiKeyTarget)}
        title="Révoquer cette clé API ?"
        description={
          page.revokeApiKeyTarget
            ? `La clé ${page.revokeApiKeyTarget.keyName} de ${page.revokeApiKeyTarget.email} sera révoquée.`
            : "La clé API sera révoquée."
        }
        confirmLabel="Révoquer"
        onOpenChange={(open) => !open && page.setRevokeApiKeyTarget(null)}
        onConfirm={() => void page.revokeManagedApiKey()}
      />

      <CoachConfirmationDialog
        open={Boolean(page.deleteUserTarget)}
        title="Supprimer ce compte ?"
        description={
          page.deleteUserTarget
            ? `Le compte ${page.deleteUserTarget.email} et ses données seront supprimés.`
            : "Le compte et ses données seront supprimés."
        }
        confirmLabel="Supprimer"
        onOpenChange={(open) => !open && page.setDeleteUserTarget(null)}
        onConfirm={() => void page.deleteUser()}
        isPending={page.isDeletingUser}
      />

      <CoachConfirmationDialog
        open={Boolean(page.calendarRegenerationTarget)}
        title="Régénérer ce lien calendrier ?"
        description={
          page.calendarRegenerationTarget
            ? `L'ancien lien sera invalidé pour ${page.calendarRegenerationTarget.label}. Les abonnements Google Calendar existants devront être recréés avec la nouvelle URL.`
            : "Le lien calendrier actuel sera invalidé et remplacé."
        }
        confirmLabel="Régénérer"
        onOpenChange={(open) => !open && page.setCalendarRegenerationTarget(null)}
        onConfirm={() => void page.regenerateCalendarUrl()}
      />
    </>
  );
}
