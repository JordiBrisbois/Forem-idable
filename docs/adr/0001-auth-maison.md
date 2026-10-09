# ADR-0001 — Authentification, sessions et CSRF faits maison

## Contexte

La plateforme est **mono-tenant** et **auto-hébergée** : chaque établissement déploie
sa propre instance. Les rôles sont simples et fixes (`user`, `coach`, `admin`), il
n'y a **pas de fournisseur d'identité externe** (pas d'OAuth/SSO/entreprise) et le
produit doit démarrer avec le strict minimum de configuration (`DATABASE_URL`, un
secret d'audit).

## Décision

Implémenter à la main, sur les primitives de la plateforme :

- **Sessions** : token aléatoire, **stocké haché** (`token_hash`) en base via Drizzle,
  cookie `httpOnly`, expiration en base + purge, cascade à la suppression de compte.
- **Mots de passe** : hachage lent + vérification en **temps constant** ; mot de passe
  temporaire généré côté serveur et affiché **une seule fois** à la création d'un compte.
- **Réinitialisation** : token à usage unique, haché, avec expiration.
- **CSRF** : vérification d'`Origin`/`Referer` + `Sec-Fetch-Site` contre l'origine
  attendue (`APP_BASE_URL` ou en-têtes de proxy). Centralisé dans `requestOrigin.ts`.
- **Autorisation** : prédicats centralisés dans `src/lib/authz.ts`
  (`isAdmin`/`isCoach`/`canCoach`/`isBeneficiary`) — aucune comparaison de rôle inline ailleurs.

## Alternatives envisagées

- **Auth.js / NextAuth** : orienté providers OAuth ; ajoute une dépendance et un
  modèle de configuration inadaptés à un mono-tenant sans IdP.
- **Lucia / bibliothèque de sessions** : bon candidat, mais on tenait à un schéma
  en base entièrement maîtrisé et à zéro dépendance d'auth côté runtime.
- **CSRF via double-submit cookie / lib** : notre appel API est same-origin avec
  cookie de session ; le contrôle d'origine couvre le besoin sans jeton additionnel.

## Conséquences

**Positives** : flux explicite et auditable (~quelques centaines de lignes), aucune
dépendance d'authentification, aucune configuration externe requise pour déployer,
modèle de rôles exprimé directement (dont la protection « dernier admin »).

**Négatives / responsabilités** : la robustesse repose sur notre code et notre revue —
comparaison en temps constant, rotation de session au changement de mot de passe,
TTL/usage unique des tokens, purge des sessions expirées. Ces points sont couverts par
des tests unitaires et doivent rester couverts à chaque évolution.

**Évolution** : si l'équipe grandit ou si un besoin SSO apparaît, migration vers une
bibliothèque vetted possible sans changer le modèle de rôles (l'autorisation est déjà
isolée dans `authz.ts`).
