# Tests

## Stratégie

Trois niveaux, chacun avec un rôle précis — on ne teste pas la même chose trois
fois :

| Niveau | Outil | Ce qui est vérifié |
|---|---|---|
| **Unitaire** | Vitest (jsdom) | Logique pure : utilitaires, hooks, schémas Zod, calculs de coût/dates, mapping d'erreurs. Postgres et Redis sont mockés. |
| **Intégration HTTP** | Vitest | Wrappers de routes (`withSessionHandler`) : CSRF, garde d'accès, validation du corps, mapping erreur → statut HTTP. Postgres et Redis sont mockés. |
| **Intégration données** | Vitest + vrai Postgres/Redis | Le SQL réel : upserts, index d'unicité, jointures de permissions, visibilité des conversations, protocole Redis. Fichiers `*.integration.test.ts`, exécutés dans les jobs `postgres` et `redis`. |
| **E2E** | Playwright | Parcours utilisateur complets contre un vrai Postgres : auth, espace coach, admin, messagerie, conformité, recherche. |

Le découpage suit la règle « tester au niveau où le comportement existe » : une
règle métier se teste sans navigateur, un parcours se teste sans mock.

## Commandes

```bash
npm test              # suite unitaire + intégration
npm run test:watch    # mode watch
npm run test:coverage # suite + rapport de couverture (seuils bloquants)
npm run test:e2e      # Playwright (voir prérequis ci-dessous)
```

## Couverture

Le périmètre est défini dans `vitest.config.mts` :

- **inclus** : `src/**/*.{ts,tsx}` ;
- **exclus** : tests, déclarations `.d.ts`, `src/types/`, les primitives
  shadcn/ui (code vendu, pas du code applicatif), les entrées App Router
  (`src/app/**`, couvertes en E2E) et les déclarations Drizzle
  (`src/lib/server/schema.ts`, sans comportement).

Les **seuils sont un cliquet**, pas un objectif marketing : ils sont fixés juste
sous la mesure courante (≈ 25,8 % de lignes) pour interdire une régression, et se
relèvent au fur et à mesure que des tests sont ajoutés. Un seuil que personne
n'atteint finit contourné ; un seuil qui suit la réalité est maintenu.

Les suites `*.integration.test.ts` sont **skippées** dans cette mesure (pas de
serveur dans le job `quality`) : leur couverture est réelle mais mesurée à part,
dans les jobs `postgres` et `redis`. Le cliquet ne porte donc que sur la suite
unitaire, ce qui le rend stable d'un run à l'autre.

## Intégration données

`npm test` les saute sans serveur. Pour les lancer en local :

```bash
RUN_DB_INTEGRATION=1 \
DATABASE_URL=postgres://postgres:postgres@localhost:5432/app \
npx vitest run integration --no-file-parallelism
```

`RUN_DB_INTEGRATION` est le seul déclencheur : le job `quality` exporte lui aussi
un `DATABASE_URL` (factice, requis par `next build`), donc la variable seule ne
prouve pas qu'un serveur répond. Les suites partagent une base et tronquent
avant chaque test, d'où le `--no-file-parallelism` : deux fichiers en parallèle
se détruiraient mutuellement les données.

Les fixtures vivent dans `src/lib/server/testFixtures.ts`, **pas** dans `tests/` :
`.dockerignore` exclut `tests/` alors que `next build` type-check tout le projet,
donc un import hors du contexte Docker casse la construction de l'image — et
seulement elle : `tsc` et la CI passent, le déploiement échoue. C'est aussi la
raison pour laquelle `playwright.config.ts` duplique ses constantes au lieu de
les importer.

Le chiffre global est bas parce que l'essentiel du volume est du JSX de pages et
de composants, dont la valeur est vérifiée par les parcours E2E. La couverture
utile est celle des modules de logique (`src/lib/server/`, `src/features/*/utils`),
où elle est nettement plus élevée.

## E2E

Les specs vivent dans `tests/e2e/`. Le `global-setup` réinitialise la base et
crée l'administrateur ; les tests supposent donc une base **jetable** :

```bash
E2E_REAL_DB=1 \
E2E_DATABASE_URL=postgres://postgres:postgres@localhost:5432/app \
FEATURE_JOB_SEARCH=true ALLOW_PUBLIC_REGISTRATION=true \
npx playwright test
```

La CI fournit un service `postgres:18-alpine` et lance Chromium seul (voir
`.github/workflows/ci.yml`). Le rapport HTML est archivé en cas d'échec.

## Conventions d'écriture

- **Fabriques plutôt que littéraux** : `buildApplication(overrides)` rend les
  tests lisibles et insensibles à l'ajout d'un champ obligatoire.
- **Mocker à la frontière** : on mocke le module externe (`vi.mock("redis")`),
  pas les fonctions internes du module testé.
- **Pas de test dépendant du temps réel** : les dates sont injectées en
  paramètre (voir `scoutExportFileName(format, date)`).
- **Attendre un état, pas un nombre de ticks** : les helpers de « flush »
  utilisent une macrotâche, sinon un `await` ajouté dans l'implémentation casse
  le test sans que le comportement change.
- Un test qui échoue doit dire **ce qui est faux**, pas seulement qu'une valeur
  diffère : asserter sur le message ou la structure attendue.

## CI

Cinq jobs, sur chaque push et pull request :

1. **quality** — `npm ci`, audit des dépendances de production, `tsc --noEmit`,
   ESLint, tests avec couverture (échec si sous les seuils), `next build`.
2. **e2e** — Postgres en service, `playwright test`, rapport archivé en cas
   d'échec.
3. **postgres** — Postgres en service, suites `*.integration.test.ts` du SQL réel.
4. **redis** — Redis en service, protocole réel (rate limiter, pub/sub).
5. **docker** — construit la vraie image avec le `Dockerfile` et le
   `.dockerignore` de production, en injectant les mêmes build args que Coolify,
   puis **démarre le conteneur** et attend une réponse HTTP sur le port 3000.
   C'est le seul job qui voit le contexte Docker : il attrape un import hors
   contexte que `tsc` et `next build` laissent passer sur le checkout complet.
   Le démarrage est vérifié séparément de la construction parce que le stade
   `runner` (sortie standalone, `drizzle/`, `scripts/`, `node server.js`) n'est
   exécuté nulle part ailleurs en CI — les E2E pilotent `next dev`. Aucune base
   n'est attachée : un `5xx` est une réponse valide, seul un port muet échoue.

Le job `quality` a un budget de 10 minutes : il doit rester le retour rapide ;
les quatre autres jobs sont là pour la profondeur et tournent en parallèle.
