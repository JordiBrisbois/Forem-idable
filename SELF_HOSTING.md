# Auto-hébergement

Ce guide explique comment déployer l'application pour votre propre établissement.
Une instance = un établissement (mono-tenant). Aucune donnée n'est partagée entre instances.

## 1. Pré-requis

- **Node.js ≥ 22** (ou Docker)
- **PostgreSQL ≥ 15**
- **Redis** (optionnel : rate limiting distribué et messagerie temps réel)
- Un reverse proxy avec HTTPS (Nginx, Caddy, Traefik…) en production

## 2. Première configuration

```bash
cp env.example .env
# Renseignez au minimum : DATABASE_URL, AUDIT_HASH_SECRET, APP_BASE_URL
```

### Variables essentielles

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | Oui | Chaîne de connexion PostgreSQL |
| `AUDIT_HASH_SECRET` | Oui | Clé HMAC pour l'anonymisation RGPD des ids dans les logs (`openssl rand -hex 32`) |
| `APP_BASE_URL` | Oui | Origine publique (CSRF, liens email) |
| `APP_NAME` | Non | Nom visible du produit (white-label) |
| `FEATURE_JOB_SEARCH` | Non | `false` pour désactiver le module de recherche d'offres |
| `ALLOW_PUBLIC_REGISTRATION` | Non | `false` pour fermer les inscriptions publiques |
| `DEFAULT_SEARCH_GOAL` | Non | `internship` ou `job` (défaut pour les nouveaux comptes) |
| `ODWB_API_KEY` | Non | Clé Opendatasoft (serveur) pour relever le quota de recherche d'offres |

Voir [`env.example`](env.example) pour la liste complète (branding, rétention, analytics, email).

### Recherche d'offres (ODWB / Opendatasoft)

Le module `FEATURE_JOB_SEARCH` interroge le jeu de données public
**offres-d-emploi-forem** (ODWB / Opendatasoft). Les appels passent par un
**proxy serveur caché** (`/api/offers/odwb`) : toute l'instance partage un même flux
d'appels, ce qui réduit fortement la consommation.

Le palier **anonyme** d'Opendatasoft est plafonné (10 000 appels/jour). Pour plus de
marge, créez une clé API gratuite et définissez `ODWB_API_KEY` (côté **serveur** :
elle n'est jamais exposée au client). Sans clé, le module fonctionne mais peut
renvoyer une erreur temporaire en cas de dépassement de quota.

Un second fournisseur (**Adzuna**) peut être activé via `ADZUNA_ENABLED`,
`ADZUNA_APP_ID` et `ADZUNA_APP_KEY`.

## 3. Lancer avec Docker Compose (recommandé)

```bash
docker compose up -d --build
```

- L'application écoute sur le port `3000`.
- Un service `postgres` avec volume persistant est fourni.
- Redis est optionnel : `docker compose --profile redis up -d`.

Les migrations sont appliquées automatiquement au premier accès à la base.

## 4. Lancer sans Docker

```bash
npm install
npm run build
npm start          # écoute sur le port configuré (3000 par défaut)
```

Prévoyez un reverse proxy (Nginx/Caddy) devant le serveur. Les en-têtes
`X-Forwarded-Proto` et `X-Forwarded-For` sont utilisés pour la détection d'origine
(CSRF) et le logging.

## 5. Créer le premier administrateur

Au tout premier lancement, aucune donnée n'existe : ouvrez l'application à la
racine et vous serez redirigé vers **`/setup`**.

1. Remplissez le formulaire (prénom, nom, email, mot de passe).
2. Ce compte devient **administrateur**.
3. Une fois configuré, `/setup` est verrouillé automatiquement.

Ensuite, depuis l'administration (`/admin`) vous pouvez :
- **Créer des coachs** (email, prénom, nom, mot de passe temporaire généré).
- **Créer des classes** et y **ajouter des bénéficiaires** et des coachs.

> Il n'y a plus de « premier inscrit = admin ». Seul `/setup` crée le premier admin.

## 6. Déploiement via Coolify

1. Créez une ressource **Application** reliant votre dépôt Git.
2. Build pack : **Dockerfile** (ce dépôt fournit un `Dockerfile` multi-stage).
3. Ajoutez un service **PostgreSQL** (volume persistant) et réglez `DATABASE_URL`
   sur la variable interne Coolify de la base.
4. Renseignez les variables d'environnement (voir `env.example`).
5. Activez le **webhook d'auto-deploy** pour redéployer à chaque `git push`.

Healthcheck recommandé : `GET /` sur le port `3000`.

## 7. Sauvegardes

- Base de données : `pg_dump` régulier du volume PostgreSQL.
- Les fichiers ne sont pas persistés côté application (tout est en base).

## 8. Maintenance

```bash
# Purge des données de rétention (sessions, exports, logs, messages)
npm run maintenance:purge

# Réinitialiser l'instance (⚠️ irréversible) : vide la base et rejoue le schéma
node scripts/reset-demo.mjs
```

> En conteneur (sans shell), on peut aussi définir `RESET_DATABASE_ON_BOOT=true`
> le temps d'un redéploiement : la base est vidée puis le schéma baseline est
> rejoué au démarrage. **Repassez ce flag à `false` juste après**, sinon chaque
> redémarrage effacera les données.
