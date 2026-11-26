# ADR-0007 — Rapatriement du jeu d'offres Forem dans PostgreSQL

## Contexte

La recherche interrogeait ODWB « offres-d-emploi-forem » à chaque requête, derrière
le cache et le budget décrits dans l'[ADR-0006](0006-cache-budget-offres.md).

En exploitation, le plafond réel du jeu s'est révélé être **10 000 appels/jour
partagés entre tous les consommateurs du dataset** — pas le quota du workspace
(50 000) ni celui de la clé. Preuves relevées :

- la même clé, au même instant, ouvre un dataset restreint du même portail (404
  sans clé → 200 avec clé) mais reçoit `429 errorcode 10005` sur
  `offres-d-emploi-forem` ;
- une clé volontairement invalide reçoit `401`, donc la clé réelle était bien
  acceptée : le `429` portait sur le dataset, pas sur l'authentification ;
- le compteur de la clé affichait **53 / 50 000** appels, et le `429` survenait
  aussi depuis une IP n'ayant fait qu'une poignée d'appels : ni la clé ni l'IP
  n'étaient en cause ;
- le message `call_limit: 10000, limit_time_unit: day` confirme un compteur
  journalier de dataset.

Conséquence : un appel par recherche, même avec un cache de 30 min, suffisait à
épuiser le plafond et à rendre la fonctionnalité indisponible pour tout le monde.

## Décision

Le jeu est **rapatrié une fois par cycle dans PostgreSQL** (`forem_offers`) et la
recherche lit la base. Le code est découpé par responsabilité dans
`src/lib/server/offers/` :

| Module | Rôle |
|---|---|
| `odwbRecord.ts` | Schéma Zod du record amont (passthrough pour les champs évolutifs). |
| `normalize.ts` | Record amont → ligne de la table + projection `Job` (fonctions pures). |
| `filters.ts` | Critères de recherche → conditions SQL (`ILIKE`, `text[] &&`, `IN`). |
| `repository.ts` | Lectures/écritures : recherche paginée, payload, compteurs, état de sync. |
| `source.ts` | Une page amont, chargée sur le budget d'appels existant. |
| `sync.ts` | Orchestration : pages, upsert, élagage conditionnel, état. |
| `worker.ts` | Planification : au démarrage, puis intervalle ; retry court en échec. |

Règles retenues :

- **Un appel par cycle**, pas par recherche : le jeu est lu via l'endpoint
  `exports/json` (une requête, ~26 Mo, 24 000 offres), soit ~0,01 % du plafond
  quotidien, deux fois par jour au maximum (défaut 12 h). La pagination par
  `/records` est inutilisable ici : Opendatasoft plafonne `offset` à 10 000.
- **Un instantané, pas une accumulation** : le snapshot complet est écrit puis les
  lignes absentes sont élaguées ; un instantané vide est refusé plutôt que de
  vider le miroir.
- **Élagage seulement après une passe complète** : une passe interrompue (quota,
  réseau) ne supprime jamais de lignes.
- **Le payload amont est conservé** (`payload jsonb`) : la fiche détaillée et les
  nouveaux champs ne nécessitent aucun appel supplémentaire.
- **La sync est opt-out** (`OFFERS_SYNC_ENABLED=0`) : sans elle, la recherche serait
  vide, ce qui est plus dangereux qu'un échec bruyant.
- **Le rayon d'action d'ODWB se réduit à la maintenance** : seuls la sync et le
  référentiel géographique appellent encore l'amont.

## Alternatives envisagées

- **Cache plus long (6–24 h)** : ne supprime pas la dépendance ; un pic de
  recherches distinctes épuise toujours le plafond partagé, et la fraîcheur se
  dégrade sans gain de robustesse.
- **Clé API à quota nominatif** : ne lève pas un plafond fixé au niveau du dataset
  (démontré ci-dessus) ; reste utile pour le confort de la sync.
- **Proxy externe / autre miroir** : ajoute une dépendance tierce pour un jeu de
  24 625 enregistrements qui tient dans une table.

## Conséquences

**Positives** : plus aucun `429` possible côté recherche, latence locale (~ms au
lieu de ~300 ms), filtres exacts (contrat normalisé, codes postaux, localités),
fiche détaillée servie sans appel amont, et un état de synchronisation observable.

**Négatives / assumées** : la fraîcheur dépend du cycle (12 h par défaut, réglable) ;
la table ajoute du stockage (le payload complet est conservé) ; la première
synchronisation est nécessaire avant que la recherche ne renvoie des résultats, ce
que l'API signale explicitement (`indexing: true`).
