# Contributing to the Platform

## Conventions de code

### TypeScript
- Strict mode obligatoire — zero `any` autorisé
- Types explicites sur les signatures de fonctions exportées
- Interfaces > Types pour les objets publics (extensibilité)

### Zod
- Toute entrée utilisateur (POST/PATCH body, query params) passe par un schema Zod
- Les schemas partagés vont dans `src/lib/server/requestSchemas.ts`
- Les schemas spécifiques à un domaine restent dans leur feature module
- Utiliser `readValidatedJson()` pour wrapper le parsing JSON + Zod dans les routes API

### Composants React
- `"use client"` uniquement sur les composants qui utilisent des hooks React
- Extraction de la logique métier dans des hooks `use*PageState` / `use*Actions`
- Composants shadcn/ui : suivre le pattern shadcn standard (copier depuis le registry)
- `cn()` pour toutes les classes Tailwind conditionnelles

### Base de données
- Drizzle ORM pour le CRUD standard et les queries simples
- SQL brut accepté pour les requêtes complexes (CTE, LATERAL, agrégations)
- Documenter le pourquoi du SQL brut en commentaire dans le fichier
- Toujours utiliser des requêtes paramétrées (`$1`, `$2`) — jamais d'interpolation

### Tests
- **Vitest** : logique métier, hooks React, utilitaires serveur
- **Playwright** : flux utilisateur critiques (auth, suivi, messagerie, admin, compliance)
- Nommer les fichiers `*.test.ts` / `*.test.tsx` pour qu'ils soient automatiquement inclus
- Mocker les dépendances externes (DB, Redis, fetch) avec `vi.mock`
- Pas de snapshot tests

### E2E (Playwright)
- **Session** : le middleware ne vérifie que la *présence* du cookie de session ; les specs
  reçoivent donc un `storageState` (cookie `e2e_session`, cf. `playwright.config.ts`). Les
  specs « déconnectées » le désactivent via `test.use({ storageState: emptyStorageState() })`.
- **Local (mocks, sans base)** : `npm run test:e2e`.
- **Réel (base jetable)** : `E2E_REAL_DB=1 E2E_DATABASE_URL=postgres://… npx playwright test`.
  `tests/e2e/setup/global-setup.ts` réinitialise la base, crée l'admin via `/api/setup` et
  écrit la session dans `tests/e2e/.auth/`.
- **Secrets** : ne jamais committer de cookie, token ou identifiant de session
  (`tests/e2e/.auth/` est gitignoré). Cibler une base **jetable**, jamais la prod.

### Documentation
- Toute décision structurante → un **ADR** dans `docs/adr/` (format *Contexte · Décision · Alternatives · Conséquences*).
- Garder alignés : `README.md`, `SELF_HOSTING.md`, `DOCAPI.md`, `COMPLIANCE.md` et `env.example`
  (source de vérité des variables d'environnement).
- **Ne jamais committer de secret** (cookie de session, clé API, identifiant) — voir la section E2E.

### Commits
Format : `<type>(<scope>): <description>`

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Restructuration sans changement fonctionnel |
| `security` | Correctif de sécurité |
| `test` | Ajout/modification de tests |
| `docs` | Documentation |
| `chore` | Maintenance, dépendances, config |

Exemples :
```
feat(scout): add company discovery via Overpass API
fix(auth): prevent session fixation on login
refactor(api-client): migrate messages to shared HTTP client
security: hash userIds in audit logs
```

## Pull Requests
1. Créer une branche depuis `main`
2. Faire les changements en respectant les conventions ci-dessus
3. S'assurer que `npm run build` passe
4. S'assurer que `npm test` ne régresse pas
5. Pour les features UI, vérifier le rendu mobile et desktop
6. Squash merge sur `main`

## Signalement de bugs
Ouvrir une issue avec :
- Description du comportement attendu vs observé
- Étapes pour reproduire
- Navigateur/OS (si pertinent)
- Logs serveur si disponibles
