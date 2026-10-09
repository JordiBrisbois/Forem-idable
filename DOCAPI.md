# API externe

Documentation de l'API externe de la plateforme.

Cette API est strictement réservée aux comptes possédant les rôles `coach` ou `admin`. Elle permet notamment :

- **Reporting & BI** : exporter des données vers Excel, Power Query ou un outil de BI.
- **Consultation** : lire les classes, utilisateurs et candidatures de votre périmètre.
- **Automatisation** : piloter les candidatures et les notes coach en JSON.

## Authentification & accès

### Base URL

L'URL publique de votre instance, par exemple `https://votre-domaine.example`.

### Authentification

Jeton porteur (Bearer Token) dans le header HTTP :

```http
Authorization: Bearer VOTRE_CLE_API
```

Les clés se créent depuis **Mon compte** (rôles `coach`/`admin`) et peuvent être révoquées.

### Périmètre (scope)

- **`admin`** : accès global à toutes les données de la plateforme.
- **`coach`** : accès restreint aux classes assignées et aux bénéficiaires de ces classes.

### Formats de réponse

- **`json`** (défaut) : intégration logicielle et mutations.
- **`csv`** : disponible sur les endpoints de liste via `?format=csv` (Excel, Power Query).

## Modèle de données & statuts

Il faut distinguer le **statut métier** des **indicateurs dérivés**.

### Statuts métier (`status`)

- `in_progress` : candidature en cours.
- `follow_up` : relance à effectuer.
- `interview` : entretien décroché.
- `accepted` : offre acceptée.
- `rejected` : candidature refusée.

### Indicateurs dérivés

Champs calculés, pratiques pour filtrer :

- `isFollowUpDue` (booléen) : une relance est en retard.
- `isInterviewScheduled` (booléen) : un entretien est planifié dans le futur.

> **CSV** : les en-têtes sont en français et les booléens dérivés utilisent `yes` / `no`.

### Terminologie

L'interface parle de **« classes »** ; l'API conserve le nom technique **`groups`**
(contrat stable pour les intégrations). Voir [`docs/adr/0004`](docs/adr/0004-vocabulaire-classe.md).

## Endpoints — Candidatures

### `GET /api/external/applications`

Liste les candidatures visibles selon votre périmètre.

Filtres principaux :

- `search` : recherche plein texte (nom, entreprise, intitulé, notes…).
- `groupId`, `userId`, `status` : filtrage par entité ou état.
- `dueOnly=1` : uniquement les relances en retard.
- `interviewOnly=1` : uniquement les entretiens planifiés.
- `format=csv` : export tabulaire.

Exemple de réponse JSON :

```json
{
  "applicationId": 123,
  "userId": 21,
  "userFirstName": "Alice",
  "userLastName": "Durand",
  "isFollowUpDue": true,
  "application": {
    "status": "in_progress",
    "followUpDueAt": "2026-03-20T09:00:00Z"
  }
}
```

### `PUT /api/external/applications`

**Upsert** (création ou mise à jour) d'une candidature via la clé métier `userId + jobId`.

### `PATCH /api/external/applications/:id`

Mise à jour partielle (statut, notes, dates d'entretien).

### `DELETE /api/external/applications/:id`

Suppression d'une candidature.

## Notes coach

### Notes privées — `/private-note`

- `PUT /api/external/applications/:id/private-note` : crée ou remplace la note coach privée
  (commune aux coachs de la classe).

### Notes partagées — `/shared-notes`

Notes visibles par le bénéficiaire et les autres coachs.

- `POST /api/external/applications/:id/shared-notes` : ajouter une note.
- `PATCH` / `DELETE …/shared-notes/:noteId` : modifier ou supprimer une note existante.

## Utilisateurs & classes

### `GET /api/external/users`

Liste les bénéficiaires visibles. Inclut des agrégats comme `dueCount` (relances en retard)
ainsi que `searchGoal` (`internship` ou `job`) et `beneficiaryStage` (étape du parcours).

### `PATCH /api/external/users/:userId/goal`

Met à jour l'objectif de recherche d'un bénéficiaire.

```json
{ "goal": "internship|job", "reason": "optionnel" }
```

Réponse : `{ "ok": true }`. Erreurs : `400` (paramètres invalides), `403` (accès interdit), `500`.

### `PATCH /api/external/users/:userId/stage`

Met à jour l'étape du parcours (recherche stage → en stage → recherche emploi → en emploi → sortie).
L'objectif de recherche est ajusté automatiquement.

```json
{ "stage": "internship_search|internship_ongoing|job_search|employed|exited", "reason": "optionnel" }
```

Réponse : `{ "ok": true }`.

### `GET /api/external/groups`

Liste les classes de suivi, avec leurs membres et statistiques globales.

### `GET /api/external/me`

Décrit l'acteur courant et les capacités de l'API (formats, filtres, actions d'écriture).

## Codes de réponse

- `200 OK` / `201 Created` : succès.
- `400 Bad Request` : erreur de validation.
- `401 Unauthorized` : clé API manquante ou invalide.
- `403 Forbidden` : droits insuffisants.
- `404 Not Found` : ressource inexistante.
- `429 Too Many Requests` : rate limiting atteint.

## Conseils Power Query / Excel

1. **Format CSV** : utilisez `format=csv` pour « Obtenir des données ».
2. **Indicateurs** : fiez-vous à `Relance due` (ou `isFollowUpDue`) plutôt qu'à une logique de dates locale.
3. **Encodage** : les réponses sont en **UTF-8** (accents français corrects).
