# ADR-0004 — Vocabulaire UI « classe », modèle technique « group »

## Contexte

Le terme métier visible est **« classe »** (une classe d'élèves/étudiants). Le modèle
de données et l'API externe utilisent historiquement **`group` / `coach_groups`**. Un
renommage de bout en bout toucherait la base, l'API publique (contrat pour les
intégrations) et les migrations.

## Décision

- **UI** : toujours « classe » (navigation, titres, boutons, dialogues, messages
  d'erreur, exports, noms de calendrier).
- **DB/API** : conserver `group` / `coach_groups` et les routes `/api/coach/groups`.

## Conséquences

**Positives** : expérience utilisateur cohérente sans casser le contrat d'API ni
réécrire les migrations ; le coût de renommage est évité.

**Négatives** : écart assumé entre le vocabulaire UI et technique — un nouveau
contributeur doit le savoir ; c'est documenté ici et dans `CONTRIBUTING.md` (à terme).
La correspondance est centralisée dans la couche de présentation.
