# Plateforme d'accompagnement

[![CI](https://github.com/JordiBrisbois/Forem-idable/actions/workflows/ci.yml/badge.svg)](https://github.com/JordiBrisbois/Forem-idable/actions/workflows/ci.yml)

Plateforme **auto-hébergeable** de suivi d'accompagnement : gestion des **coachs**,
des **classes** et des **bénéficiaires**, suivi des candidatures, messagerie, et un
module optionnel de recherche d'offres.

Chaque établissement déploie sa propre instance (mono-tenant) et personnalise le
produit via des variables d'environnement (nom, branding, fonctionnalités).

## Fonctionnalités

- **Administration** : création de coachs, gestion des classes, conformité RGPD, audit.
- **Classes** : créer une classe, y ajouter des bénéficiaires et des coachs.
- **Espace coach** : suivi par classe, relances, entretiens, priorités, export CSV, calendrier.
- **Bénéficiaire** : objectif de recherche (**stage** ou **emploi** commutable), suivi de candidatures.
- **Mode autonome** : un utilisateur sans classe utilise la recherche et la sauvegarde d'offres, sans coaching.
- **Messagerie** : canaux de classe et messages privés (SSE, Redis optionnel).
- **Recherche d'offres** (optionnelle) : module activable via `FEATURE_JOB_SEARCH`, sources
  pluggables (ODWB/Forem, Adzuna optionnel), filtre par **type de contrat** (stage, alternance,
  CDI…), recherche partageable par URL.
- **API externe** : endpoints JSON/CSV pour reporting (coach/admin).

## Préparation d'une instance

1. **Premier lancement** : la racine redirige vers `/setup` tant qu'aucun compte
   n'existe. Le formulaire crée le **premier administrateur**.
2. Depuis `/admin`, créez des **coachs**, des **classes**, et ajoutez-y des personnes.

> Aucun script de seed n'est requis.

## Stack

- **Next.js** (App Router) · **TypeScript** strict · Node ≥ 22
- **PostgreSQL** + **Drizzle ORM**
- **Zod** pour la validation des entrées
- **Tailwind CSS** + **shadcn/ui**
- **Vitest** (unitaires) & **Playwright** (E2E)
- **Redis** optionnel (rate limiting, pub/sub messagerie)

## Architecture

```
Client (React · shadcn/ui)
  features/*   UI + hooks « use*PageState » + clients API
  config/runtime.ts  ← window.__APP_RUNTIME_CONFIG__ injecté au SSR
        │ fetch same-origin (cookie httpOnly)
Next.js App Router
  proxy.ts (middleware)   présence du cookie, gating des modules
  app/api/**/route.ts     handlers fins
    └─ withSessionHandler / withExternalHandler
         ├─ CSRF (requestOrigin)   ├─ autorisation (authz)
         ├─ validation Zod         └─ mapping erreurs → HTTP
        │
Domaine serveur (lib/server/*: coach, compliance, messaging, applications…)
        │
Postgres (Drizzle, migrations versionnées)   ·   Redis (optionnel)
```

- **Découpage par fonctionnalité** (`src/features/*`) plutôt que par type technique :
  chaque feature garde ses composants, ses hooks et son client API.
- **Handlers de route minces** : toute la mécanique transverse vit dans les wrappers
  (`src/lib/server/apiHandler.ts`).
- **Autorisation centralisée** : `src/lib/authz.ts` est le seul endroit qui compare les rôles.
- **Persistance** : Drizzle pour le CRUD, SQL paramétré pour les requêtes complexes
  (CTE / LATERAL), migrations versionnées dans `drizzle/`.

## Décisions de conception

Les choix structurants sont documentés en ADR dans [`docs/adr/`](docs/adr/).

### Fait maison — par choix, pas par défaut

Plusieurs briques sont implémentées **à la main** volontairement (authentification,
sessions, CSRF, injection de configuration, wrappers de routes). Le raisonnement :

- **Contrôle et lisibilité** : le flux d'authentification est explicite et auditable,
  plutôt qu'opaque derrière un framework.
- **Surface réduite** : aucune dépendance d'authentification côté runtime, moins de CVE
  à suivre, pas de couplage à une API tierce.
- **Portabilité auto-hébergée** : sessions en base (Drizzle) et CSRF par vérification
  d'origine → aucune configuration d'IdP externe n'est requise pour déployer.
- **Besoin réel** : rôles simples et fixes (admin ⊇ coach ⊇ bénéficiaire) et règle
  « dernier admin » plus directs à exprimer qu'à plier dans une bibliothèque.

Les contreparties sont **assumées** et couvertes par des tests : comparaison de mot de
passe en temps constant, token de réinitialisation à usage unique, purge des sessions,
protection du dernier administrateur. Si un SSO devenait nécessaire, l'autorisation
étant déjà isolée (`authz.ts`), la migration vers une bibliothèque vetted ne toucherait
pas les features.

## Tests & CI

- **Vitest** : logique métier, hooks, utilitaires serveur, et tests d'**intégration**
  sur les wrappers de routes (CSRF, garde d'accès, validation, mapping d'erreurs).
- **Playwright** : parcours critiques (auth, coach, messagerie, admin, conformité).
- **CI GitHub Actions** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) :
  `tsc` · `eslint` · `vitest` · `next build` sur chaque push et pull request.

## Démarrage local

```bash
cp env.example .env
# Renseignez DATABASE_URL et AUDIT_HASH_SECRET au minimum
npm install
npm run dev
```

Commandes utiles :

```bash
npm run lint
npm test
npm run test:e2e
npm run db:generate     # générer une migration
npm run db:reset        # ⚠️ réinitialise la base (drop + migrations)
npm run maintenance:purge
npm run build && npm start
```

Docker :

```bash
docker compose up -d --build
```

## Déploiement

Voir **[SELF_HOSTING.md](SELF_HOSTING.md)** pour le guide complet (Docker, VPS,
Coolify, variables d'environnement, premier administrateur, sauvegardes).

## Configuration (white-label)

Tout le branding passe par des variables d'environnement (`APP_NAME`, `APP_TITLE`,
`APP_TAGLINE`, `PRIVACY_*`, `COPYRIGHT_NAME`, `APP_LOGO_URL`, `APP_BRAND_COLOR`…).
La configuration est injectée au rendu : **aucun rebuild n'est nécessaire** pour
changer le nom du produit.

| Domaine | Variables clés |
|---|---|
| Identité | `APP_NAME`, `APP_TITLE`, `APP_TITLE_SUFFIX`, `APP_TAGLINE` |
| Fonctionnalités | `FEATURE_JOB_SEARCH`, `ALLOW_PUBLIC_REGISTRATION`, `DEFAULT_SEARCH_GOAL` |
| Recherche d'offres | `ODWB_API_KEY` (quota), `ADZUNA_ENABLED` (+ `ADZUNA_APP_ID` / `ADZUNA_APP_KEY`) |
| Conformité | `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTACT_EMAIL`, `PRIVACY_SOURCE_URL` |
| Analytics | `UMAMI_ENABLED`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, `UMAMI_ALLOWED_HOSTS` |

`env.example` fait foi pour la liste complète.

### Source des offres

Les offres proviennent du jeu de données public **ODWB / Opendatasoft**
« offres-d-emploi-forem », interrogé via un **proxy serveur caché** (`/api/offers/odwb`) :
toute l'instance partage un même flux d'appels. Le palier anonyme étant plafonné,
`ODWB_API_KEY` (clé serveur, jamais exposée au client) augmente le quota.
Voir [SELF_HOSTING.md](SELF_HOSTING.md).

## Documentation

- [Auto-hébergement](SELF_HOSTING.md)
- [API externe](DOCAPI.md)
- [Conformité & RGPD](COMPLIANCE.md)
- [Décisions d'architecture (ADR)](docs/adr/)
- [Contribution](CONTRIBUTING.md)

## Licence

Code : **AGPL-3.0-only** ([LICENSE](LICENSE)).

Les données d'offres éventuellement affichées via le module de recherche restent
sous leurs licences respectives.
