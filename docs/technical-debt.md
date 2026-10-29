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

## 2. Couverture unitaire à ~24 %

**Constat.** Mesure actuelle : ~24 % de lignes, avec un périmètre qui exclut les
entrées App Router (couvertes en E2E), les primitives shadcn et les déclarations
Drizzle.

**Pourquoi c'est laissé.** Le volume non couvert est principalement du JSX de
pages et des modules d'accès aux données (`applicationStore`, `messaging`,
`coachGroups`) qui demandent un Postgres de test ; les parcours correspondants
sont couverts par les 12 specs E2E.

**Impact.** Une régression dans un module de données est attrapée par l'E2E, donc
plus tard et avec un message moins précis qu'un test d'intégration.

**Sortie.** Ajouter une base Postgres jetable aux tests d'intégration (le service
`postgres:18-alpine` existe déjà dans le job E2E) et couvrir les quatre modules
les plus volumineux. Relever ensuite les seuils de `vitest.config.mts` dans le
même commit.

## 3. Mises à jour majeures non appliquées

| Paquet | Installé | Dernière | Pourquoi en attente |
|---|---|---|---|
| `redis` | 4.7.1 | 6.x | Le chemin Redis n'est **pas vérifiable sans serveur Redis** : le client dégrade silencieusement vers la mémoire, donc un test « vert » ne prouverait rien. À faire après le test d'intégration Redis. |
| `vitest` | 4.1.12 | 5.x | Major de l'outillage de test : à passer seul, avec `@vitest/coverage-v8` aligné (PR #8 ouverte). |
| `eslint` | 9.39.5 | 10.x | Impacte `eslint-config-next` ; à faire avec la migration des règles React Compiler. |
| `typescript` | 5.9.3 | 7.x | Aucun besoin fonctionnel ; le gain est nul et le risque de casse large (PR #9 ouverte). |
| `@tanstack/react-table` | 8.21.3 | 9.x | Changement d'API de la table de résultats : à faire avec une passe de vérification UI (PR #7). |
| `jsdom` | 26.1.0 | 30.x | Environnement de test uniquement ; à passer avec `vitest` (PR #6). |
| `lucide-react` | 0.575 | 1.x | Bump d'icônes à fort diff visuel : à faire avec une passe de vérification UI. |
| Image Docker `node` | `24-alpine` | `25-alpine` | Change le runtime de production ; à valider sur une preview avant de suivre (PR #2). |

**Sortie.** Un commit par ligne, tests au vert, et la ligne supprimée de ce
tableau.

## 4. Contrôles natifs conservés

**Constat.** Il reste un `<input type="file">`, un `<input type="range">` et une
checkbox native hors de `src/components/ui/`.

**Pourquoi.** shadcn/ui ne fournit pas de champ fichier, le slider n'est pas
installé, et la checkbox est déjà accessible (label + `aria-label`) : un wrapper
Radix ajouterait une dépendance et un nœud DOM sans bénéfice mesurable.

**Sortie.** Uniquement si un besoin réel apparaît (thème du slider, état
indéterminé, etc.), via les primitives du registry.
