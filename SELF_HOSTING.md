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
**offres-d-emploi-forem** (ODWB / Opendatasoft), mais **pas en direct** : le jeu est
rapatrié dans la table `forem_offers` par une tâche de synchronisation, et la
recherche lit PostgreSQL. C'est le seul montage fiable, car le jeu impose un plafond
de **10 000 appels/jour partagé entre tous les consommateurs** : une clé API ne le
relève pas, et un appel par recherche l'épuisait en quelques heures.

La synchronisation tourne au démarrage, puis `OFFERS_SYNC_INTERVAL_HOURS` (défaut 12)
plus tard ; en cas d'échec elle réessaie après `OFFERS_SYNC_RETRY_MINUTES` (défaut
10) sans jamais effacer les offres déjà présentes. Une passe complète tient en **un
appel** (export JSON de tout le jeu, ~24 000 offres), soit une fraction infime du
plafond quotidien, une fois par cycle.

`ODWB_API_KEY` (côté **serveur**, jamais exposée au client) sert uniquement à cette
synchronisation. `OFFERS_SYNC_ENABLED=0` la désactive (la recherche reste alors
servie par les données déjà présentes).

Un second fournisseur (**Adzuna**) peut être activé via `ADZUNA_ENABLED`,
`ADZUNA_APP_ID` et `ADZUNA_APP_KEY`.

### Cache et budget d'appels

Les appels sortants restants (synchronisation des offres, référentiel géographique)
respectent un **budget d'appels** (`OFFERS_API_DAILY_BUDGET`, défaut **15 000 / 24 h**,
plus un garde-fou `OFFERS_API_MAX_CALLS_PER_MINUTE`). Le cache à deux niveaux
(**mémoire** par conteneur + **Redis** si `REDIS_URL` est défini) sert encore le
référentiel des localisations et absorbe les rafales.

En-têtes de diagnostic : `x-cache: hit|miss|stale|budget` et
`x-odwb-budget-remaining`.

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

Healthcheck : `GET /api/health` sur le port `3000` (il vérifie aussi la base).

## 7. Sauvegardes

La base contient à la fois les comptes/candidatures **et** le miroir des offres.
Le miroir est reconstructible (une synchronisation), les candidatures non :

```bash
# Sauvegarde logique (à planifier côté Coolify ou par cron)
docker exec <conteneur_postgres> pg_dump -U forem_idable -Fc forem_idable > forem_idable.dump

# Restauration dans une base neuve
pg_restore -d "$DATABASE_URL" --clean --if-exists forem_idable.dump
```

Vérifiez une restauration au moins une fois : un dump jamais testé n'est pas une
sauvegarde. Les migrations étant appliquées au démarrage, une base restaurée
reprend l'application sans intervention.

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

## 9. Alertes email (recherches enregistrées)

Un utilisateur connecté peut enregistrer une recherche et recevoir **un seul
email par jour**, quel que soit le nombre d'alertes : elles sont regroupées en
sections, une par recherche, avec un lien de désinscription sur chacune. Le
digest est calculé à partir du miroir local (`first_seen_at`), donc sans appel
supplémentaire à ODWB. La page `/account#alertes` permet de mettre une alerte en
pause ou de tout supprimer.

Prérequis : `RESEND_API_KEY` (et idéalement un domaine vérifié dans Resend pour
`RESEND_FROM_EMAIL`). L'offre gratuite de Resend plafonne à **100 emails/jour** :
avec quelques testeurs, un envoi quotidien par personne reste très en dessous.
`JOB_ALERTS_ENABLED=0` désactive le worker, et l'heure d'envoi se règle avec
`JOB_ALERTS_UTC_HOUR` (8 par défaut).

Chaque email contient le lien de désinscription (sans session, idempotent) et le
responsable de traitement. Maximum 5 alertes par compte, consentement horodaté,
suppression en cascade avec le compte — voir [COMPLIANCE.md](COMPLIANCE.md).

## 10. Forcer une synchronisation des offres

Le miroir se rafraîchit seul (au démarrage puis toutes les 12 h, avec reprise
après échec). Après un incident côté ODWB, un administrateur peut forcer une
passe sans attendre :

```bash
curl -X POST https://votre-domaine/api/admin/offers/sync --cookie "session=…"
```

L'endpoint est réservé au rôle admin : une synchronisation consomme un appel du
quota partagé du jeu de données.