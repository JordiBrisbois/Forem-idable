# 🚀 FOREM-idable

**FOREM-idable** est une plateforme moderne développée avec Next.js, dédiée à la recherche d'emploi, au suivi de candidatures et à l'accompagnement par coachs.

Ce projet a été conçu avec une double exigence : répondre à un **usage réel** tout en maintenant un niveau de **clean code** exemplaire, idéal pour une revue technique ou une démonstration en entretien. L'accent est mis sur la cohérence du front-end, la validation stricte des contrats d'entrée, une persistance type-safe et une gestion explicite des erreurs.

---

### 🌐 Version Live
🔗 [forem.brisbois.dev](https://forem.brisbois.dev)

---

## 🎯 Fonctionnalités Clés

Le produit couvre désormais sept domaines stratégiques :
*   🔍 **Recherche d'offres** : Moteur multi-source performant avec historique de recherche.
*   📋 **Suivi de candidatures** : Gestion complète du tunnel de recrutement pour les bénéficiaires.
*   👨‍🏫 **Dashboard Coach** : Pilotage et suivi par groupes pour un accompagnement personnalisé.
*   ⚙️ **Administration** : Gestion des coachs, mises en avant (featured searches), clés API et traitement des demandes de suppression.
*   💬 **Messagerie temps réel** : Canaux de groupe et messages privés.
*   📊 **API Externe** : Endpoints JSON/CSV pour le reporting et l'automatisation.
*   🛡️ **Conformité & RGPD** : Export de données, demandes de suppression, legal holds, disclosure logs et purge de rétention.

---

## 💻 Stack Technique

Le projet s'appuie sur les dernières versions stables de l'écosystème React/Next.js :

*   **Framework** : [Next.js 16](https://nextjs.org/) (App Router)
*   **Langage** : [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
*   **Runtime** : Node.js 24
*   **Base de données** : PostgreSQL avec [Drizzle ORM](https://orm.drizzle.team/)
*   **Validation** : [Zod](https://zod.dev/) pour le typage des contrats et la validation runtime
*   **UI/UX** : Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
*   **Tests** : [Vitest](https://vitest.dev/) (Unit/Integration) & [Playwright](https://playwright.dev/) (E2E)
*   **Infrastructure** : Redis (optionnel) pour le rate limiting et le pub/sub de la messagerie.

---

## 🏗️ Architecture

L'organisation du code suit une approche **feature-first** pour garantir la scalabilité :

```txt
src/
  ├── app/             # Routes Next.js (Pages, Layouts) et Handlers API
  ├── features/        # Composants UI, hooks et logique métier par domaine
  ├── lib/server/      # Logique serveur pure : Services, Accès DB, Sécurité
  ├── components/ui/   # Primitives UI (Design System atomique)
  └── types/           # Contrats applicatifs et interfaces partagées
```

### Principes Fondamentaux :
*   **API Routes "Thin"** : Responsables uniquement de l'auth, de la validation et de l'orchestration.
*   **Business Logic isolée** : Toute la logique métier réside dans `src/lib/server`.
*   **State Management localisé** : Utilisation de hooks `use*PageState` pour concentrer l'état de page.
*   **Type Safety de bout en bout** : Contrats Front/Back explicites via Zod et TypeScript.

### Décisions d'Architecture

| Décision | Choix | Justification |
|---|---|---|
| ORM | **Drizzle** > Prisma | Zero codegen, pas de CLI lourd, schema TypeScript natif, accès SQL brut quand le query builder est limité (CTE, LATERAL, `FOR UPDATE`) |
| Messagerie temps réel | **SSE + Redis fallback** > WebSockets | Compatible Next.js edge runtime, fallback in-memory en dev/single-instance, Redis Pub/Sub pour la scalabilité horizontale |
| Architecture | **Feature-first** > Layered | Co-location composants/hooks/utils par domaine, scalabilité sans explosion de fichiers transversaux |
| Hashage mot de passe | **scrypt natif** > bcrypt/argon2 | Pas de dépendance native (pas de compilation), memory-hard par défaut, `timingSafeEqual` contre les timing attacks |
| Queries complexes | **SQL brut documenté** > ORM forcé | `messaging.data.ts`, `coach.ts dashboard` utilisent des CTE/LATERAL que Drizzle n'exprime pas proprement — garder le SQL lisible > forcer l'ORM |
| Validation | **Zod sur toutes les entrées** | Zero `typeof` checks ou `as` casts sur les données utilisateur — chaque route POST/PATCH passe par `readValidatedJson()` |

---

## 🛠️ Choix Techniques & Qualité logicielle

### ✅ Validation & Sécurité
Toutes les mutations critiques sont verrouillées par des schémas Zod. L'objectif est double : prévenir les erreurs 500 et garantir des contrats d'interface homogènes et robustes.

### 🗄️ Persistance Type-Safe
L'utilisation de **Drizzle ORM** permet de manipuler une base de données typée. Le domaine "Candidature" repose sur une couche relationnelle explicite, optimisée pour les exports et les besoins analytiques des coachs.

### 📨 Messagerie Hybride
La messagerie utilise HTTP pour l'écriture et **Server-Sent Events (SSE)** pour le live-stream. Le bus d'événements est conçu pour être résilient :
*   **Mode Standard** : Fallback en mémoire pour un déploiement simplifié.
*   **Mode Distribué** : Redis Pub/Sub activable via `REDIS_URL` pour la scalabilité.

### 🛡️ Gestion d'Erreurs
Utilisation systématique des `error.tsx` de Next.js pour des Error Boundaries segmentaires, offrant une expérience utilisateur fluide même en cas d'imprévu.

### 🧪 Stratégie de Tests
Le projet ne vise pas le 100% théorique, mais une **couverture pragmatique des flux critiques** :
*   **Vitest** : Logique métier pure et helpers.
*   **Playwright** : Parcours utilisateurs (Auth, Suivi, Messagerie, Admin, Compliance).

### 🔐 Conformité pragmatique
Le projet inclut un premier pack conformité orienté usage réel :
*   **Espace compte** : Export JSON des données personnelles et demande de suppression avec revue manuelle.
*   **Administration** : Validation, rejet ou finalisation des demandes de suppression.
*   **Garde-fous** : `legal holds` pour suspendre une suppression ou une purge si nécessaire.
*   **Traçabilité** : `disclosure logs` pour journaliser une divulgation ciblée à une autorité.
*   **Rétention** : purge scriptable des données temporaires et expirées.

---

## 🔌 API Externe & Intégrations

Réservée aux comptes `coach` et `admin` via clés API.
*   **Endpoints** : Gestion utilisateurs, groupes et mutations de candidatures.
*   **Reporting** : Exports CSV avec indicateurs calculés (`isFollowUpDue`, `isInterviewScheduled`).

📖 [Consulter la documentation API détaillée](DOCAPI.md)
📖 [Consulter la note conformité](COMPLIANCE.md)

---

## 🚀 Installation & Développement

### Pré-requis
*   **Node.js** ≥ 22
*   **PostgreSQL** ≥ 15
*   **Redis** (optionnel, pour le rate limiting distribué et le pub/sub messagerie)

```bash
cp env.example .env.local
# Renseigner DATABASE_URL et AUDIT_HASH_SECRET au minimum
npm install
```

### Variables d'environnement essentielles

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | Oui | Chaîne de connexion PostgreSQL |
| `AUDIT_HASH_SECRET` | **Oui** | Clé HMAC pour l'anonymisation RGPD des userId dans les logs (générer avec `openssl rand -hex 32`) |
| `REDIS_URL` | Non | Redis pour rate limiting distribué et pub/sub messagerie |
| `APP_BASE_URL` | Oui | Origine publique utilisée par les checks CSRF et les liens email |
| `RESEND_API_KEY` | Non | API key Resend pour les emails (reset password) |
| `ADZUNA_ENABLED` | Non | Active le fournisseur d'offres Adzuna (requiert `ADZUNA_APP_ID` + `ADZUNA_APP_KEY`) |

Voir [`env.example`](env.example) pour la liste complète (rétention, branding, analytics).

### Commandes utiles
```bash
# Développement
npm run dev

# Qualité & Tests
npm run lint
npm test            # Unitaires
npm run test:e2e    # End-to-end

# Base de données
npm run db:generate
npm run db:migrate

# Maintenance
npm run maintenance:purge

# Production
npm run build
npm start
```

### Déploiement

Le projet est conçu pour fonctionner sur n'importe quel hébergeur Node.js supportant Next.js :

**Option 1 — VPS (Coolify, Docker)**
```bash
npm run build
npm start  # Écoute sur le port configuré (par défaut 3000)
```
Prévoir un reverse proxy (Nginx/Caddy) devant le serveur Next.js. Les headers `X-Forwarded-Proto` et `X-Forwarded-For` sont utilisés pour la détection d'origine CSRF et le logging.

**Option 2 — Vercel / Railway**
Déployer directement depuis le repository. Configurer les variables d'environnement dans le dashboard. Redis peut être omis si le déploiement est mono-instance (fallback in-memory automatique).

**Base de données** : Appliquer les migrations au déploiement :
```bash
npm run db:migrate
```
Aucun seed n'est requis — le premier compte créé via l'interface de registration reçoit le rôle `user`. Promouvoir manuellement en `admin` via `psql` :
```sql
UPDATE users SET role = 'admin' WHERE email = 'votre@email.com';
```

---

## 📋 Conventions de Code

*   **Validation systématique** : Pas d'entrée de données sans schéma Zod.
*   **Composition de composants** : Logique métier extraite des composants de rendu.
*   **Observabilité** : Logs de timing serveur et audit activables en environnement critique.
*   **Refactoring continu** : Isolation progressive des services historiques vers des modules serveurs propres.
*   **Conformité outillée** : Les droits utilisateurs et les revues admin passent par des workflows applicatifs plutôt que par des manipulations directes en base.

---

## 📄 Licence
Ce projet est sous licence [GNU AGPL v3.0](LICENSE) (`AGPL-3.0-only`).

Le code source public du service est disponible sur GitHub :
https://github.com/VoxSake/FOREM-idable

## 📚 Licence Des Données

Le code de l'application est distribué sous `AGPL-3.0-only`, mais les données d'offres issues du
jeu de données **Le Forem / ODWB** relèvent d'une licence distincte.

*   **Code de l'application** : `AGPL-3.0-only`
*   **Données d'offres Forem / ODWB** : [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr)
*   **Source du dataset** : [ODWB - offres-d-emploi-forem](https://www.odwb.be/explore/dataset/offres-d-emploi-forem/information/)

Lorsqu'une offre Forem est affichée, l'application peut reformater ou structurer certaines
informations pour en faciliter la lecture. Les contenus sources restent attribués à Le Forem /
ODWB, conformément à la licence du dataset.
