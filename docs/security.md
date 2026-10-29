# Sécurité

Document de référence des contrôles en place et de leurs limites. Il décrit le
code, pas une intention : si une règle ci-dessous n'est plus vraie, c'est un bug.

## Modèle de menace

Le produit est **auto-hébergé, mono-tenant** : chaque établissement déploie son
instance, avec sa base et ses secrets. Les actifs à protéger sont :

- les **données des bénéficiaires** (identité, parcours, candidatures) ;
- les **sessions** et les comptes (admin ⊇ coach ⊇ bénéficiaire) ;
- les **clés d'API externes** (reporting) et les secrets d'instance (SMTP, clés
  fournisseurs) ;
- la **traçabilité** (journal d'audit, conformité).

Les adversaires considérés : un visiteur non authentifié, un compte légitime qui
tente d'élargir ses droits, un attaquant réseau qui rejoue ou falsifie des
requêtes, et une dépendance compromise en amont.

## Authentification et sessions

- **Mots de passe** : `scrypt` (sel aléatoire de 16 octets, 64 octets dérivés),
  comparaison en temps constant (`timingSafeEqual`). Voir `src/lib/server/auth.ts`.
- **Sessions** : jeton aléatoire de 32 octets (`base64url`), stocké en base dans
  `sessions` avec une échéance de **7 jours**. Aucun jeton auto-porteur : la
  révocation est une suppression de ligne, donc immédiate.
- **Cookie** : `httpOnly`, `sameSite=lax`, `secure`, nom issu de la configuration
  runtime — donc un cookie volé par script ne peut pas être lu par le JavaScript
  de la page, et un cookie d'une instance ne vaut pas pour une autre.
- **Réinitialisation** : jetons à usage unique en base (`passwordResetTokens`),
  consommés à l'usage.
- **Déconnexion** : supprime la ligne de session, pas seulement le cookie.

## CSRF et contrôle d'origine

Les mutations passent par `withSessionHandler`, qui rejette toute requête dont
l'origine ne correspond pas à l'instance (`rejectCrossOriginRequest`). L'origine
attendue est `APP_BASE_URL` si elle est configurée, sinon reconstruite depuis
`x-forwarded-proto` / `x-forwarded-host` (cas du reverse proxy). Le cookie
`sameSite=lax` est la seconde barrière, pas la seule.

## Autorisation

- Les rôles sont **fixes** : `admin`, `coach`, `user`. La hiérarchie et toutes
  les comparaisons vivent dans `src/lib/authz.ts` — aucun handler ne compare un
  rôle à la main.
- Les wrappers exposent `access: "user" | "coach" | "admin"` ; le type de
  l'utilisateur reçu est affiné en conséquence (le compilateur refuse un accès
  admin sur un handler coach).
- La règle **« dernier administrateur »** empêche de supprimer ou rétrograder le
  dernier compte admin de l'instance.

## Limitation de débit

`src/lib/server/rateLimit.ts` applique une fenêtre glissante par portée
(`scope`) et par IP (en tenant compte de `x-forwarded-for`, `x-real-ip`,
`cf-connecting-ip`). Avec Redis, l'incrément et l'expiration sont atomiques
(script Lua `INCR` + `PEXPIRE`) ; sans Redis, un compteur mémoire prend le
relais — le service fonctionne donc sans Redis, avec une protection moindre
entre instances.

## En-têtes HTTP et CSP

Définis dans `next.config.ts` pour toutes les réponses :

| En-tête | Valeur |
|---|---|
| `Content-Security-Policy` | `default-src 'self'`, `frame-ancestors 'none'`, `form-action 'self'`, `base-uri 'self'`, `script-src 'self' 'unsafe-inline'`, `connect-src` limité aux API réellement appelées |
| `Strict-Transport-Security` | HSTS (instance servie en HTTPS) |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | fonctionnalités navigateur désactivées par défaut |

`'unsafe-inline'` reste nécessaire pour l'amorçage inline de Next.js ; il ne
permet pas d'injecter un script tiers puisque `script-src` n'autorise ni `http:`
ni domaine externe (Umami n'est ajouté à la CSP que s'il est explicitement
activé et servi en HTTPS).

## API externe

Les endpoints de reporting utilisent `withExternalHandler` : authentification
par **clé d'API** (`src/lib/server/apiKeys.ts`), clés créées et révoquées depuis
l'administration, jamais dans le client. Ces routes ne partagent pas le chemin
d'authentification par session et ne donnent pas accès aux mutations.

## Journalisation et audit

- Les lignes de log sont structurées (`logServerEvent`) avec `category`,
  `action`, `requestId` et un `meta` sans secret.
- L'identifiant utilisateur n'apparaît **jamais en clair** dans les logs : il est
  remplacé par un HMAC-SHA256 tronqué calculé avec `AUDIT_HASH_SECRET`, ce qui
  garde les lignes corrélables sans exposer l'identité.
- Le **journal d'audit** (`src/lib/server/auditLog.ts`) enregistre les actions
  sensibles pour la conformité : qui, quoi, quand, sur quelle cible.
- Les messages d'erreur renvoyés au client sont génériques : la cause détaillée
  reste dans les logs, jamais dans la réponse HTTP.

## Conformité et rétention

Voir [COMPLIANCE.md](../COMPLIANCE.md) pour le détail RGPD. Côté technique :

- **purge** des données au-delà de la durée de conservation
  (`npm run maintenance:purge`) ;
- **legal hold** : un compte sous obligation de conservation est exclu des
  purges et des suppressions, et l'interface l'indique ;
- export et suppression de compte côté bénéficiaire, tracés dans l'audit.

## Chaîne de dépendances

- `npm run audit:prod` est **bloquant en CI** pour les avis `high`/`critical` sur
  les dépendances de production. La liste d'exceptions de
  `scripts/check-audit.mjs` est **vide** : aucune vulnérabilité connue n'est
  acceptée aujourd'hui.
- Dependabot groupe les mises à jour mineures/patch et traite les avis de
  sécurité hors de la fenêtre hebdomadaire (`.github/dependabot.yml`).
- Une dépendance non maintenue est remplacée, pas exemptée : c'est ainsi que
  SheetJS (`xlsx`) a été retiré du projet.

## Signalement d'une vulnérabilité

Voir [`SECURITY.md`](../SECURITY.md) à la racine : signalement privé via les
avis de sécurité GitHub, pas d'issue publique.

## Hors périmètre / limites assumées

- **Pas de MFA** ni de SSO : l'authentification est maison et volontairement
  simple (ADR-0001). Si un SSO devient nécessaire, l'autorisation étant isolée,
  la migration resterait localisée.
- **Pas de protection anti-abus distribuée** sans Redis : la limitation de débit
  mémoire est locale au processus.
- **Pas de chiffrement applicatif au repos** : la protection repose sur le
  chiffrement disque et les sauvegardes de l'hébergeur.
