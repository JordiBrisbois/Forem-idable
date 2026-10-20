# ADR-0006 — Cache des offres et budget d'appels ODWB

## Contexte

La recherche d'offres interroge le jeu de données ODWB « offres-d-emploi-forem ».
Le **quota est fixé au niveau du workspace** (`www.odwb.be`) : **50 000 appels par
période**, avec un reset quotidien, et il est **partagé** par tout ce qui utilise la
clé. Le dataset est rafraîchi ~quotidiennement, mais chaque page de recherche
correspond à un appel (100 offres), et une instance peut recevoir beaucoup de
requêtes identiques.

L'ancien cache était **mémoire par conteneur, 5 minutes**, ne conservait que les
réponses 200 et ne prévoyait ni repli en cas de panne ni déduplication des appels
concurrents. Un bug, une boucle ou un pic pouvait donc consommer le quota.

## Décision

Une couche de cache dédiée (`src/lib/server/cache/`), en modules :

- **L1 mémoire** bornée (500 entrées, LRU-ish), **L2 Redis** automatique si
  `REDIS_URL` est défini (partagé entre instances, conservé entre redéploiements).
  Redis est **best-effort** : absent ou en erreur ⇒ on retombe sur la mémoire.
- **Read-through avec stale-on-error** : les entrées expirées sont conservées et
  resservies si l'amont échoue (429/5xx/timeout).
- **Single-flight** : les `miss` concurrents sur une même clé ne déclenchent qu'un
  appel amont.
- **TTL** : recherche **30 min** fresh / **24 h** stale ; facettes « type de
  contrat » **12 h** / **48 h** ; cache client 60 s.
- **Budget dur** : compteur glissant **24 h** (`OFFERS_API_DAILY_BUDGET`, défaut
  **15 000**, soit 30 % du quota) + **garde 60 appels/min**
  (`OFFERS_API_MAX_CALLS_PER_MINUTE`) + alerte log à 80 %. Budget épuisé ⇒ aucun
  appel amont, stale servi, sinon `429`.
- **Clé API strictement serveur** (`ODWB_API_KEY`) : ajoutée au moment de l'appel
  amont uniquement, et exclue de la clé de cache.
- **Observabilité** : `x-cache: hit|miss|stale|budget`, `x-odwb-budget-remaining`.

## Alternatives envisagées

- **Redis uniquement** : latence sur chaque hit et dépendance dure à Redis.
- **Sans budget** : un bug suffit à épuiser le quota partagé pour la journée.
- **TTL courts (5 min)** : ~288 appels/jour/requête, soit plusieurs dizaines de
  milliers pour quelques centaines de requêtes distinctes — trop proche du plafond.
- **Appels directs depuis le navigateur** : exposerait la clé et rendrait tout
  cache partagé impossible.

## Conséquences

**Positives** : consommation maîtrisée et bornée, résilience aux pannes/quota,
aucun secret côté client, cache partagé et persistant avec Redis, comportement
observable via des en-têtes.

**Négatives / assumées** : les résultats peuvent avoir jusqu'à 30 min (facettes
12 h) ; sans Redis, le cache et le budget sont **par conteneur** (métriques non
partagées entre réplicas) ; deux niveaux de cache à raisonner, mais isolés dans des
modules dédiés.
