# Plateforme d'accompagnement

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
- **Recherche d'offres** (optionnelle) : module activable via `FEATURE_JOB_SEARCH`, sources pluggables.
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
| Conformité | `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTACT_EMAIL`, `PRIVACY_SOURCE_URL` |
| Analytics | `UMAMI_ENABLED`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID` |

## Documentation

- [Auto-hébergement](SELF_HOSTING.md)
- [API externe](DOCAPI.md)
- [Conformité & RGPD](COMPLIANCE.md)
- [Contribution](CONTRIBUTING.md)

## Licence

Code : **AGPL-3.0-only** ([LICENSE](LICENSE)).

Les données d'offres éventuellement affichées via le module de recherche restent
sous leurs licences respectives.
