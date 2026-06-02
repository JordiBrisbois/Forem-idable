# 🔌 API Externe - Documentation

Documentation de l'API externe de la plateforme **FOREM-idable**.

Cette API est strictement réservée aux comptes possédant les rôles `coach` ou `admin`. Elle permet notamment :
*   📊 **Reporting & BI** : Exportation de données vers Excel, Power Query ou des outils de BI.
*   🔍 **Consultation** : Lecture des groupes, utilisateurs et candidatures au sein de votre périmètre.
*   🤖 **Automatisation** : Pilotage programmatique des candidatures et des notes coach via JSON.

---

## 🔐 Authentification & Accès

### Base URL
*   **Production** : `https://forem.brisbois.dev`

### Authentification
L'authentification s'effectue via un jeton porteur (Bearer Token) dans le header HTTP :
```http
Authorization: Bearer VOTRE_CLE_API
```

### Périmètre (Scope)
*   **`admin`** : Accès global à l'ensemble des données de la plateforme.
*   **`coach`** : Accès restreint aux groupes assignés et aux bénéficiaires membres de ces groupes.

### Formats de réponse
L'API supporte deux formats de sortie selon vos besoins :
*   **`json`** (par défaut) : Idéal pour l'intégration logicielle et les mutations.
*   **`csv`** : Disponible sur les endpoints de liste (`?format=csv`) pour une exploitation directe dans Excel.

---

## 📊 Modèle de Données & Statuts

Il est important de distinguer le **statut métier** des **indicateurs dérivés** :

### Statuts Métier (`status`)
*   `in_progress` : Candidature en cours.
*   `follow_up` : Relance à effectuer.
*   `interview` : Entretien décroché.
*   `accepted` : Offre acceptée.
*   `rejected` : Candidature refusée.

### Indicateurs Dérivés
L'API expose des champs calculés pour faciliter le filtrage :
*   `isFollowUpDue` (booléen) : Indique si une relance est en retard.
*   `isInterviewScheduled` (booléen) : Indique si un entretien est planifié dans le futur.

> **Note sur le CSV** : Pour faciliter l'usage dans Excel, les en-têtes sont en français et les booléens dérivés utilisent les valeurs `yes/no`.

---

## 🛣️ Endpoints Candidatures (`/applications`)

### `GET /api/external/applications`
Liste les candidatures visibles selon votre périmètre.

**Filtres principaux :**
*   `search` : Recherche plein texte (Nom, Entreprise, Intitulé, Notes...).
*   `groupId`, `userId`, `status` : Filtrage par entité ou état.
*   `dueOnly=1` : Uniquement les relances en retard.
*   `interviewOnly=1` : Uniquement les entretiens planifiés.
*   `format=csv` : Export tabulaire.

**Exemple de réponse JSON :**
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
**Upsert** (Création ou Mise à jour) d'une candidature via la clé métier `userId + jobId`.

### `PATCH /api/external/applications/:id`
Mise à jour partielle d'une candidature (changement de statut, ajout de notes, dates d'entretien).

### `DELETE /api/external/applications/:id`
Suppression d'une candidature.

---

## 📝 Gestion des Notes Coach

### Notes Privées (`/private-note`)
*   `PUT /api/external/applications/:id/private-note` : Crée ou remplace la note coach privée (commune aux coachs du groupe).

### Notes Partagées (`/shared-notes`)
Notes visibles par le bénéficiaire et les autres coachs.
*   `POST /api/external/applications/:id/shared-notes` : Ajouter une note.
*   `PATCH` / `DELETE` : Modifier ou supprimer une note existante via son `noteId`.

---

## 👥 Utilisateurs & Groupes

### `GET /api/external/users`
Liste les bénéficiaires visibles. Inclut des agrégats comme `dueCount` (nombre de relances en retard) ainsi que `trackingPhase` (phase de suivi actuelle).

### `PATCH /api/external/users/:userId/phase`
Met à jour la phase de suivi d'un bénéficiaire.

**Body :**
```json
{
  "phase": "internship_search|job_search|placed|dropped",
  "reason": "optionnel"
}
```

**Réponse :**
```json
{ "ok": true }
```

**Erreurs possibles :** `400` (paramètres invalides), `403` (accès interdit), `500` (erreur serveur).

### `GET /api/external/groups`
Liste les groupes de suivi. Permet d'extraire la liste des membres et leurs statistiques globales.

---

## 🚥 Codes de Réponse

*   `200 OK` / `201 Created` : Succès.
*   `400 Bad Request` : Erreur de validation (vérifiez votre payload Zod).
*   `401 Unauthorized` : Clé API manquante ou invalide.
*   `403 Forbidden` : Droits insuffisants pour accéder à cette ressource.
*   `404 Not Found` : Ressource inexistante.
*   `429 Too Many Requests` : Rate limiting atteint.

---

## 💡 Conseils Power Query / Excel

1.  **Format CSV** : Utilisez systématiquement `format=csv` pour vos requêtes "Obtenir des données".
2.  **Indicateurs** : Fiez-vous à `Relance due` (ou `isFollowUpDue`) plutôt qu'à une logique locale complexe basée sur les dates.
3.  **Encodage** : L'API renvoie du contenu en **UTF-8** pour garantir le support des accents français.
