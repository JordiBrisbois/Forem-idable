"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminLegalHoldTargetOption,
  fetchAdminLegalHoldTargetOptions,
} from "@/features/admin/adminApi";
import {
  AdminLegalHoldFormValues,
  adminLegalHoldFormSchema,
} from "@/features/admin/adminComplianceSchemas";
import {
  AdminLegalHoldUserTarget,
  AdminLegalHoldSelectableTarget,
  getUserTargetLabel,
} from "./complianceUtils";

interface AdminLegalHoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCreating: boolean;
  userTargets: AdminLegalHoldUserTarget[];
  legalHoldDraft: {
    targetType: "user" | "conversation" | "application";
    targetId: number | null;
  } | null;
  onCreateLegalHold: (payload: {
    targetType: "user" | "conversation" | "application";
    targetId: number;
    reason: string;
  }) => Promise<boolean>;
}

function AdminLegalHoldTargetCombobox({
  options,
  selectedTargetId,
  onSelect,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  isLoading,
  shouldFilter,
  searchValue,
  onSearchValueChange,
}: {
  options: AdminLegalHoldSelectableTarget[];
  selectedTargetId: number | null;
  onSelect: (id: number) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  isLoading?: boolean;
  shouldFilter?: boolean;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((entry) => entry.id === selectedTargetId) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedOption ? (
            <span className="flex items-center gap-2 truncate">
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.description ? (
                <span className="truncate text-xs text-muted-foreground">
                  {selectedOption.description}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={shouldFilter ?? true}>
          <CommandInput placeholder={searchPlaceholder} value={searchValue} onValueChange={onSearchValueChange} />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Chargement..." : emptyLabel}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.id}`}
                  onSelect={() => {
                    onSelect(option.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 size-4 ${selectedOption?.id === option.id ? "opacity-100" : "opacity-0"}`}
                  />
                  <span className="flex flex-1 items-center gap-2 truncate">
                    <span className="truncate">{option.label}</span>
                    {option.description ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function useAdminLegalHoldAsyncOptions(
  targetType: "application" | "conversation",
  enabled: boolean,
  search: string
) {
  const deferredSearch = useDeferredValue(search);
  const [options, setOptions] = useState<AdminLegalHoldTargetOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const { data } = await fetchAdminLegalHoldTargetOptions(targetType, deferredSearch);
        if (!cancelled) {
          setOptions(data.options ?? []);
        }
      } catch {
        if (!cancelled) {
          setOptions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [targetType, enabled, deferredSearch]);

  return { options, isLoading };
}

export function AdminLegalHoldDialog({
  open,
  onOpenChange,
  isCreating,
  userTargets,
  legalHoldDraft,
  onCreateLegalHold,
}: AdminLegalHoldDialogProps) {
  const [applicationSearch, setApplicationSearch] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");

  const form = useForm<AdminLegalHoldFormValues>({
    resolver: zodResolver(adminLegalHoldFormSchema),
    defaultValues: {
      targetType: "user",
      targetId: "",
      reason: "",
    },
  });

  const targetType = useWatch({ control: form.control, name: "targetType" });
  const rawTargetId = useWatch({ control: form.control, name: "targetId" });

  const selectedLegalHoldTargetId = useMemo(() => {
    const currentValue = rawTargetId;
    const parsed = Number(currentValue);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [rawTargetId]);

  const userOptions = useMemo<AdminLegalHoldSelectableTarget[]>(
    () =>
      userTargets.map((entry) => ({
        id: entry.id,
        label: getUserTargetLabel(entry),
        description: `${entry.email} · ${entry.role}`,
      })),
    [userTargets]
  );

  const { options: applicationOptions, isLoading: isApplicationOptionsLoading } =
    useAdminLegalHoldAsyncOptions("application", open && targetType === "application", applicationSearch);

  const { options: conversationOptions, isLoading: isConversationOptionsLoading } =
    useAdminLegalHoldAsyncOptions("conversation", open && targetType === "conversation", conversationSearch);

  const onSubmit = form.handleSubmit(async (values) => {
    const success = await onCreateLegalHold({
      targetType: values.targetType,
      targetId: Number(values.targetId),
      reason: values.reason,
    });
    if (!success) return;

    form.reset({
      targetType: "user",
      targetId: "",
      reason: "",
    });
    onOpenChange(false);
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        targetType: "user",
        targetId: "",
        reason: "",
      });
      return;
    }

    form.reset({
      targetType: legalHoldDraft?.targetType ?? "user",
      targetId:
        legalHoldDraft?.targetId && Number.isInteger(legalHoldDraft.targetId)
          ? String(legalHoldDraft.targetId)
          : "",
      reason: "",
    });
  }, [open, legalHoldDraft, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Créer un legal hold</DialogTitle>
          <DialogDescription>
            Gèle une suppression ou une purge ciblée jusqu&apos;à levée manuelle.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="legal-hold-target-type">Type de cible</FieldLabel>
              <Select
                value={targetType}
                onValueChange={(value) => {
                  form.setValue("targetType", value as AdminLegalHoldFormValues["targetType"], {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                  form.setValue("targetId", "", {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                  setApplicationSearch("");
                  setConversationSearch("");
                }}
              >
                <SelectTrigger id="legal-hold-target-type">
                  <SelectValue placeholder="Type de cible" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="conversation">Conversation</SelectItem>
                    <SelectItem value="application">Candidature</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            {targetType === "user" ? (
              <Field data-invalid={form.formState.errors.targetId ? "true" : undefined}>
                <FieldLabel>Utilisateur ciblé</FieldLabel>
                <AdminLegalHoldTargetCombobox
                  options={userOptions}
                  selectedTargetId={selectedLegalHoldTargetId}
                  onSelect={(userId) => {
                    form.setValue("targetId", String(userId), {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                  }}
                  placeholder="Sélectionner un utilisateur"
                  searchPlaceholder="Rechercher un utilisateur..."
                  emptyLabel="Aucun utilisateur correspondant."
                />
                {form.formState.errors.targetId ? (
                  <FieldError>{form.formState.errors.targetId.message}</FieldError>
                ) : null}
              </Field>
            ) : targetType === "application" ? (
              <Field data-invalid={form.formState.errors.targetId ? "true" : undefined}>
                <FieldLabel>Candidature ciblée</FieldLabel>
                <AdminLegalHoldTargetCombobox
                  options={applicationOptions}
                  selectedTargetId={selectedLegalHoldTargetId}
                  onSelect={(applicationId) => {
                    form.setValue("targetId", String(applicationId), {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                  }}
                  placeholder="Sélectionner une candidature"
                  searchPlaceholder="Rechercher une candidature..."
                  emptyLabel="Aucune candidature correspondante."
                  isLoading={isApplicationOptionsLoading}
                  shouldFilter={false}
                  searchValue={applicationSearch}
                  onSearchValueChange={setApplicationSearch}
                />
                {form.formState.errors.targetId ? (
                  <FieldError>{form.formState.errors.targetId.message}</FieldError>
                ) : null}
              </Field>
            ) : targetType === "conversation" ? (
              <Field data-invalid={form.formState.errors.targetId ? "true" : undefined}>
                <FieldLabel>Conversation ciblée</FieldLabel>
                <AdminLegalHoldTargetCombobox
                  options={conversationOptions}
                  selectedTargetId={selectedLegalHoldTargetId}
                  onSelect={(conversationId) => {
                    form.setValue("targetId", String(conversationId), {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                  }}
                  placeholder="Sélectionner une conversation"
                  searchPlaceholder="Rechercher une conversation..."
                  emptyLabel="Aucune conversation correspondante."
                  isLoading={isConversationOptionsLoading}
                  shouldFilter={false}
                  searchValue={conversationSearch}
                  onSearchValueChange={setConversationSearch}
                />
                {form.formState.errors.targetId ? (
                  <FieldError>{form.formState.errors.targetId.message}</FieldError>
                ) : null}
              </Field>
            ) : (
              <Field data-invalid={form.formState.errors.targetId ? "true" : undefined}>
                <FieldLabel htmlFor="legal-hold-target-id">Identifiant cible</FieldLabel>
                <Input
                  id="legal-hold-target-id"
                  type="number"
                  aria-invalid={form.formState.errors.targetId ? "true" : "false"}
                  {...form.register("targetId")}
                />
                {form.formState.errors.targetId ? (
                  <FieldError>{form.formState.errors.targetId.message}</FieldError>
                ) : null}
              </Field>
            )}
            <Field data-invalid={form.formState.errors.reason ? "true" : undefined}>
              <FieldLabel htmlFor="legal-hold-reason">Motif</FieldLabel>
              <Textarea
                id="legal-hold-reason"
                aria-invalid={form.formState.errors.reason ? "true" : "false"}
                {...form.register("reason")}
              />
              {form.formState.errors.reason ? (
                <FieldError>{form.formState.errors.reason.message}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating}>
              Créer le legal hold
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
