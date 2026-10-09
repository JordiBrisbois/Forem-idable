# ADR-0005 — Suppression des tables inutilisées

## Contexte

Trois tables du schéma n'avaient **aucune écriture** dans le code (elles n'étaient que
créées puis relues par l'export RGPD, donc toujours vides) :

- `user_favorites` — ancien « pipeline de présélection » d'offres, remplacé par
  `applications` (suivi) et `user_search_history` (recherches récentes).
- `user_settings` — ancien stockage de préférences/thème/consentement, jamais alimenté
  (les préférences vivent côté client via `localStorage`).
- `application_events` — journal d'événements d'application jamais écrit (l'audit réel
  passe par `audit_logs`).

## Décision

- Retirer les définitions du schéma (`src/lib/server/schema.ts`).
- Retirer leurs lectures de l'export RGPD (`compliance/dataExports.ts`).
- Les supprimer en base via une migration `0002_drop_unused_tables.sql`
  (`DROP TABLE IF EXISTS … CASCADE`), idempotente.

## Conséquences

**Positives** : schéma plus honnête (chaque table a un écrivain), export RGPD allégé,
moins de surface à maintenir. Aucune donnée perdue (tables vides).

**Négatives** : si une instance tierce avait écrit dans ces tables hors de ce code,
la migration les supprimerait — improbable et sans impact sur les fonctionnalités
actuelles.
