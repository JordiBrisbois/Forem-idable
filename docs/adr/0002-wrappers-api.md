# ADR-0002 — Wrappers de routes API et autorisation centralisée

## Contexte

L'API comptait une soixantaine de handlers `route.ts` répétant la même séquence :
contexte de requête, contrôle CSRF, garde d'accès, validation Zod du body, `try/catch`
et mapping d'erreurs — chacun avec ses propres messages et statuts, ce qui divergeait
peu à peu.

## Décision

Extraire cette mécanique dans deux wrappers dans `src/lib/server/apiHandler.ts` :

- `withSessionHandler({ access, body?, csrf?, ... }, handler)` pour les routes à cookie
  de session (`access: "user" | "coach" | "admin"`).
- `withExternalHandler({ body? }, handler)` pour l'API à clé Bearer.

Complété par :

- `src/lib/server/errors.ts` : table de mapping **erreur métier → HTTP** (`Forbidden`→403,
  `User not found`→404, doublon→409, `LastAdmin`→400…).
- `src/lib/server/routeParams.ts` : `parseRouteId` partagé.
- `src/lib/authz.ts` : prédicats de rôle.

Le `user`/`actor` passé au handler est **typé selon l'accès** (`UserFor<A>`), donc un
handler `admin` reçoit un `AuthUser & { role: "admin" }` sans cast.

## Conséquences

**Positives** : chaque handler passe de ~20-25 lignes à ~5-10 ; comportement transverse
(CSRF, statuts, messages) **uniforme** ; les règles d'accès se lisent d'un coup d'œil.

**Négatives** : quelques routes à logique particulière restent hors wrapper (rate
limiting spécifique, SSE `stream`, `scout/autocomplete` public) — assumé, ce sont des
exceptions documentées plutôt que la règle.

**Messages** : la table de mapping reproduit les messages existants ; quand une route
avait un texte unique (`forbiddenMessage`, `notFoundMessage`, `bodyErrorMessage`),
l'option permet de le conserver.
