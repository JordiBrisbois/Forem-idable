"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterToggleGroup } from "@/components/ui/filter-toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LocalPagination } from "@/components/ui/local-pagination";
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
  createFeaturedSearchFormValues,
  FeaturedSearchFormValues,
  featuredSearchFormSchema,
  toFeaturedSearchFormValues,
  toFeaturedSearchPayload,
} from "@/features/admin/featuredSearchForm";
import { CoachConfirmationDialog } from "@/features/coach/components/dialogs/CoachConfirmationDialog";
import { FeaturedSearchPayload } from "@/features/featured-searches/featuredSearchSchema";
import { FeaturedSearch } from "@/types/featuredSearch";

function formatQueryPreview(item: FeaturedSearch) {
  return item.query.keywords.join(` ${item.query.booleanMode === "AND" ? "ET" : "OU"} `);
}

interface AdminFeaturedSearchesSectionProps {
  featuredSearches: FeaturedSearch[];
  isLoading: boolean;
  isSaving: boolean;
  savingId: number | null;
  isDeleting: boolean;
  onRefresh: () => void;
  onCreate: (payload: FeaturedSearchPayload) => Promise<boolean>;
  onUpdate: (id: number, payload: FeaturedSearchPayload) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

export function AdminFeaturedSearchesSection({
  featuredSearches,
  isLoading,
  isSaving,
  savingId,
  isDeleting,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
}: AdminFeaturedSearchesSectionProps) {
  const [editingItem, setEditingItem] = useState<FeaturedSearch | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FeaturedSearch | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const form = useForm<FeaturedSearchFormValues>({
    resolver: zodResolver(featuredSearchFormSchema),
    mode: "onChange",
    defaultValues: createFeaturedSearchFormValues(),
  });
  const [currentBooleanMode = "OR", currentIsActive = true] = useWatch({
    control: form.control,
    name: ["booleanMode", "isActive"],
  });

  const dialogTitle = editingItem ? "Modifier la recherche" : "Nouvelle recherche";
  const dialogDescription = editingItem
    ? "Ajustez le contenu, l’ordre et le bouton affichés sur la page d’accueil."
    : "Créez une recherche préconfigurée visible sous le moteur principal.";
  const isCurrentSavePending =
    isSaving && (editingItem ? savingId === editingItem.id : savingId === null);

  const sortedItems = useMemo(() => {
    const filtered = [...featuredSearches]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .filter((item) => {
        if (filter === "all") return true;
        return filter === "active" ? item.isActive : !item.isActive;
      });

    return filtered;
  }, [featuredSearches, filter]);
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const filterOptions = [
    { value: "all" as const, label: `Toutes (${featuredSearches.length})` },
    {
      value: "active" as const,
      label: `Actives (${featuredSearches.filter((item) => item.isActive).length})`,
    },
    {
      value: "inactive" as const,
      label: `Inactives (${featuredSearches.filter((item) => !item.isActive).length})`,
    },
  ];
  const visibleItems = useMemo(
    () => sortedItems.slice((safePage - 1) * pageSize, safePage * pageSize),
    [safePage, sortedItems]
  );

  const resetForm = () => {
    form.reset(createFeaturedSearchFormValues());
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: FeaturedSearch) => {
    form.reset(toFeaturedSearchFormValues(item));
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload = toFeaturedSearchPayload(values);
    const success = editingItem
      ? await onUpdate(editingItem.id, payload)
      : await onCreate(payload);

    if (!success) {
      return;
    }

    setIsDialogOpen(false);
    setEditingItem(null);
    resetForm();
  });

  const titleError = form.formState.errors.title?.message;
  const ctaLabelError = form.formState.errors.ctaLabel?.message;
  const messageError = form.formState.errors.message?.message;
  const keywordsError = form.formState.errors.keywordsInput?.message;
  const sortOrderError = form.formState.errors.sortOrder?.message;

  return (
    <Card className="gap-0 border-border/60 bg-card py-0">
      <CardHeader className="border-b border-border/60 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl">Recherches mises en avant</CardTitle>
            <CardDescription>
              Cartes éditoriales affichées sur la page d&apos;accueil entre la recherche et
              l&apos;historique.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onRefresh}>
              Actualiser
            </Button>
            <Button type="button" onClick={openCreateDialog}>
              <Plus data-icon="inline-start" />
              Ajouter une recherche
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="w-full max-w-3xl">
            <FilterToggleGroup
              options={filterOptions}
              value={filter}
              onValueChange={(value) => {
                setFilter(value);
                setPage(1);
              }}
              renderIcon={(option) =>
                option.value === "all" ? <Search data-icon="inline-start" /> : null
              }
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {sortedItems.length} recherche{sortedItems.length > 1 ? "s" : ""} affichée
            {sortedItems.length > 1 ? "s" : ""}
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
            Chargement des recherches mises en avant...
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
            Aucune recherche mise en avant pour l&apos;instant.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="flex h-full flex-col justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:border-primary/25 hover:bg-muted/30"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.isActive ? "secondary" : "outline"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">Ordre {item.sortOrder}</Badge>
                    <Badge variant="outline">
                      <Search data-icon="inline-start" />
                      {item.query.booleanMode === "AND" ? "Mode ET" : "Mode OU"}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-lg font-semibold tracking-tight">{item.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{item.message}</p>
                  </div>

                  <div className="flex flex-col gap-2 text-sm">
                    <p>
                      <span className="font-medium">Bouton:</span> {item.ctaLabel}
                    </p>
                    <p className="text-muted-foreground">{formatQueryPreview(item)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(item)}
                  >
                    <Pencil data-icon="inline-start" />
                    Modifier
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 data-icon="inline-start" />
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sortedItems.length > 0 ? (
          <div className="mt-4">
              <LocalPagination
                currentPage={safePage}
                pageCount={pageCount}
                totalCount={sortedItems.length}
                pageSize={pageSize}
              itemLabel="recherches"
              compact
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </CardContent>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (open) {
            return;
          }

          setEditingItem(null);
          resetForm();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <FieldGroup className="gap-5">
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={titleError ? "true" : undefined}>
                  <FieldLabel htmlFor="featured-search-title">Titre</FieldLabel>
                  <Input
                    id="featured-search-title"
                    placeholder="Salon de l'emploi à SPA"
                    aria-invalid={titleError ? "true" : "false"}
                    {...form.register("title")}
                  />
                  {titleError ? <FieldError>{titleError}</FieldError> : null}
                </Field>

                <Field data-invalid={ctaLabelError ? "true" : undefined}>
                  <FieldLabel htmlFor="featured-search-cta">Label du bouton</FieldLabel>
                  <Input
                    id="featured-search-cta"
                    placeholder="Consulter les offres"
                    aria-invalid={ctaLabelError ? "true" : "false"}
                    {...form.register("ctaLabel")}
                  />
                  {ctaLabelError ? <FieldError>{ctaLabelError}</FieldError> : null}
                </Field>
              </FieldGroup>

              <Field data-invalid={messageError ? "true" : undefined}>
                <FieldLabel htmlFor="featured-search-message">Message</FieldLabel>
                <Textarea
                  id="featured-search-message"
                  placeholder="Le salon aura lieu le 1er avril à SPA. Consultez les offres publiées pour l'événement."
                  rows={5}
                  aria-invalid={messageError ? "true" : "false"}
                  {...form.register("message")}
                />
                <FieldDescription>
                  Texte affiché sur la carte. Restez direct et court.
                </FieldDescription>
                {messageError ? <FieldError>{messageError}</FieldError> : null}
              </Field>

              <Field data-invalid={keywordsError ? "true" : undefined}>
                <FieldLabel htmlFor="featured-search-keywords">Mots-clés</FieldLabel>
                <Textarea
                  id="featured-search-keywords"
                  placeholder="SALONSPA, forum emploi, jobday"
                  rows={3}
                  aria-invalid={keywordsError ? "true" : "false"}
                  {...form.register("keywordsInput")}
                />
                <FieldDescription>
                  Séparez les mots-clés par des virgules ou des retours à la ligne.
                </FieldDescription>
                {keywordsError ? <FieldError>{keywordsError}</FieldError> : null}
              </Field>

              <FieldGroup className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px_160px]">
                <Field>
                  <FieldLabel htmlFor="featured-search-mode">Mode booléen</FieldLabel>
                  <Select
                    value={currentBooleanMode}
                    onValueChange={(value) =>
                      form.setValue("booleanMode", value as "AND" | "OR", {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger id="featured-search-mode" className="w-full">
                      <SelectValue placeholder="Choisir un mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="OR">OU</SelectItem>
                        <SelectItem value="AND">ET</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field data-invalid={sortOrderError ? "true" : undefined}>
                  <FieldLabel htmlFor="featured-search-order">Ordre</FieldLabel>
                  <Input
                    id="featured-search-order"
                    type="number"
                    min="0"
                    max="999"
                    aria-invalid={sortOrderError ? "true" : "false"}
                    {...form.register("sortOrder")}
                  />
                  {sortOrderError ? <FieldError>{sortOrderError}</FieldError> : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="featured-search-active">Statut</FieldLabel>
                  <label
                    htmlFor="featured-search-active"
                    className="flex min-h-9 items-center gap-3 rounded-md border border-border/60 px-3"
                  >
                    <Checkbox
                      id="featured-search-active"
                      checked={currentIsActive}
                      onCheckedChange={(checked) =>
                        form.setValue("isActive", checked === true, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <span className="text-sm">{currentIsActive ? "Visible" : "Masquée"}</span>
                  </label>
                </Field>
              </FieldGroup>
            </FieldGroup>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isCurrentSavePending || !form.formState.isValid}>
                {isCurrentSavePending ? (
                  <LoaderCircle data-icon="inline-start" className="animate-spin" />
                ) : null}
                {editingItem ? "Enregistrer" : "Créer la recherche"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CoachConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Supprimer cette recherche ?"
        description={
          deleteTarget
            ? `La recherche "${deleteTarget.title}" sera retirée de l'administration et de la page d'accueil.`
            : "Cette recherche sera supprimée."
        }
        confirmLabel="Supprimer"
        isPending={isDeleting}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          void onDelete(deleteTarget.id).then((success) => {
            if (success) {
              setDeleteTarget(null);
            }
          });
        }}
      />
    </Card>
  );
}
