# Dette technique suivie

Ce fichier liste ce qui est **sciemment** laissé en l'état, avec la raison et la
condition de sortie. Une dette non écrite est un oubli ; une dette écrite avec un
critère de sortie est une décision.

Règle : chaque entrée a un **impact** (ce que ça coûte aujourd'hui) et une
**sortie** (ce qui permet de la fermer). Quand la sortie est atteinte, l'entrée
disparaît du fichier en même temps que le code change.

## 1. Avertissements `react-hooks/set-state-in-effect` (17)

**Constat.** ESLint signale 17 appels à `setState` synchrones dans un `useEffect`,
répartis sur les hooks de chargement (`useApplications`, `useAccountApiKeys`,
`useSearchHistory`, `AuthProvider`, …) et quelques dialogues qui recopient une
prop dans l'état local.

**Pourquoi c'est laissé.** Ces hooks chargent leurs données côté client dans un
effet : c'est le pattern historique du projet, il fonctionne, et le remplacer
touche l'état de plusieurs pages sans test visuel automatisé. La règle est en
`warn` (voir `eslint.config.mjs`) pour que la CI reste verte pendant la migration.

**Impact.** Aucun en production aujourd'hui. Un rendu en cascade supplémentaire
par montage, et du bruit dans `npm run lint`.

**Sortie.** Deux chemins, à choisir par écran :

1. extraire un hook `useInitialLoad(load, deps)` qui déclenche le chargement
   après le montage, avec annulation — les 13 chargements se ramènent alors à
   une ligne et la règle passe ;
2. déplacer le chargement côté serveur (composant serveur / route handler) pour
   les écrans qui n'ont pas besoin de rafraîchissement client.

Une fois les 17 sites traités, passer la règle de `warn` à `error` dans
`eslint.config.mjs` — c'est la vraie condition de fermeture.

## 2. Couverture des modules de données restants

**Constat.** Le harnais d'intégration Postgres existe désormais (job `postgres`,
suites `*.integration.test.ts`, fixtures partagées) et couvre les trois modules
les plus sensibles : `applicationStore`, `messaging` et `coachGroups`. Les seuils
de `vitest.config.mts` ont été relevés en même temps (≈ 25,8 % de lignes).

**Preuve que ça paye.** Ces suites ont trouvé, dès leur premier run, un vrai
défaut : `canManageCoachAssignments` comparait un `bigint` rendu en `string` par
`pg` à un `number`, donc aucun groupe n'était gérable par son manager non-admin
(archivage, suppression, affectation de coachs). L'E2E ne l'avait pas vu parce
qu'elle pilote ces écrans en administrateur.

**Pourquoi le reste est laissé.** Les modules de données secondaires restent
couverts uniquement par l'E2E : `applications.ts`, `coach.ts`,
`calendarSubscriptions.ts`, `apiKeys.ts`, `accounts.ts`, `searchHistory.ts`,
`compliance.ts`. Le volume non couvert du projet reste majoritairement du JSX de
pages, hors de portée d'un test unitaire et déjà exercé par les parcours.

**Impact.** Une régression dans un de ces modules est attrapée par l'E2E, donc
plus tard et avec un message moins précis qu'un test d'intégration.

**Sortie.** Un fichier `*.integration.test.ts` par module restant, en réutilisant
`tests/integration/fixtures.ts` ; les seuils de `vitest.config.mts` se relèvent
dans le même commit. Quand un module n'a pas de logique propre à vérifier
(cascade pure, simple CRUD), la sortie est de le retirer de cette liste avec une
ligne de justification ici.

## 3. Mises à jour majeures non appliquées

| Paquet | Installé | Dernière | Pourquoi en attente |
|---|---|---|---|
| `typescript` | 5.9.3 | 7.x | **Bloqué en amont** : `typescript-eslint` (embarqué par `eslint-config-next`) refuse TS 7.0 au chargement — `npm run lint` échoue avant toute vérification. La PR #9 a été fermée pour cette raison ; à reprendre quand le support TS ≥ 7.1 arrive. |
| `@types/node` | 24.x | 26.x | Doit refléter le runtime réel de l'image (Node 24) : merger 26 laisserait TypeScript accepter des API absentes du conteneur. Bump couplé à la migration du runtime ci-dessous. |

**Sortie.** Un commit par ligne, tests au vert, et la ligne supprimée de ce
tableau. Les majeures listées ici sont ignorées par Dependabot
(`.github/dependabot.yml`) pour que la file de PR reste lisible ; les mises à
jour de sécurité ne sont pas concernées par ces `ignore`.

**Runtime Node.** L'image est épinglée à un patch LTS précis (`node:24.22.2-alpine`)
et la CI tourne sur le même major depuis #23 : un seul runtime, celui qui est
réellement déployé. Un changement de major (26 LTS depuis octobre 2026) se fait
dans son propre commit — Dockerfile + `@types/node` + `engines` + CI — avec
vérification du déploiement, jamais par un déplacement de tag. Dependabot ignore
les majeures sur cette image pour cette raison.

**`lucide-react`.** Volontairement hors de ce tableau : la 0.x est activement
publiée (0.577 aujourd'hui) et la 1.x n'apporte ni correctif ni fonctionnalité
nécessaire, pour un diff visuel à re-vérifier partout. À reconsidérer le jour où
une icône manque ou si la 0.x cesse d'être maintenue.

## 4. Contrôles natifs conservés

**Constat.** Il reste un `<input type="file">`, un `<input type="range">` et une
checkbox native hors de `src/components/ui/`.

**Pourquoi.** shadcn/ui ne fournit pas de champ fichier, le slider n'est pas
installé, et la checkbox est déjà accessible (label + `aria-label`) : un wrapper
Radix ajouterait une dépendance et un nœud DOM sans bénéfice mesurable.

**Sortie.** Uniquement si un besoin réel apparaît (thème du slider, état
indéterminé, etc.), via les primitives du registry.
