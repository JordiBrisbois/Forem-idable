# ADR-0003 — Configuration white-label injectée au runtime

## Contexte

Le produit doit être **rebrandable sans rebuild** : chaque établissement change le nom,
le logo, la couleur, les textes de conformité, etc. Or Next.js n'inline dans le bundle
client que les variables préfixées `NEXT_PUBLIC_*` au **moment du build** — une variable
d'exécution comme `APP_NAME` n'est pas visible côté client, sinon par coïncidence.

## Décision

Construire une configuration côté serveur (`src/config/runtime.server.ts`) à partir
des variables d'environnement, puis l'**injecter dans le HTML** au rendu racine via
`window.__APP_RUNTIME_CONFIG__`, que le client lit (`src/config/runtime.ts`).

Les valeurs ont des **défauts neutres** (ex. `APP_NAME = "Mon établissement"`) afin que
le rendu SSR et client coïncident même sans configuration.

## Alternatives envisagées

- **Tout en `NEXT_PUBLIC_*`** : imposerait un rebuild à chaque changement de branding.
- **Config API appelée par le client** : flash de contenu non stylé et complexité inutile.

## Conséquences

**Positives** : changement de branding = redéploiement du conteneur, pas de rebuild ;
cohérence SSR/client garantie par les défauts neutres.

**Négatives** : il faut injecter le script au bon endroit du layout et garder les
défauts synchronisés entre serveur et client. Le point d'injection est unique
(`src/app/layout.tsx`).
