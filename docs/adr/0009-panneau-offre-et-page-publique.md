# ADR-0009 — Panneau d'offre, URL partageable et page publique

## Contexte

La fiche latérale est appréciée : elle garde la liste sous les yeux, ce qui est
exactement le geste d'un chercheur qui compare plusieurs offres. Mais elle avait
trois limites :

1. elle n'était **pas partageable** : fermer l'onglet perdait l'offre ;
2. elle n'existait **que** dans l'application : aucun lien envoyé par email,
   aucun référencement ;
3. chaque panneau avait sa propre largeur (`max-w-xl`, `60vw`, `lg/xl`), donc
   l'application changeait de gabarit d'un écran à l'autre.

Le détail complet d'une offre n'est pas dans le jeu de données ODWB (uniquement
la fiche structurée). Il est disponible via l'endpoint du front Forem
(`/recherche-offres/api/Diffusion/DetailOffre/{id}`), vérifié depuis le serveur
de production.

## Décision

**Un seul contenu, deux hôtes.**

- **Panneau latéral** : lecture par défaut depuis la liste, agrandi (`xl`,
  56 rem) et structuré en en-tête fixe / corps défilant / actions collantes.
- **URL** : l'offre ouverte vit dans `?offre=<id>`, à côté des paramètres de
  recherche. Rafraîchir ou partager ce lien rouvre le même écran.
- **Page `/offres/[id]`** : rendue côté serveur, autonome, canonique, avec
  `JobPosting` en JSON-LD. C'est ce que reçoivent les liens externes, les
  nouveaux onglets et les moteurs de recherche.
- **Sitemap progressif** : seules les offres dont le détail est déjà en cache
  sont listées. Publier 24 000 pages ferait déclencher autant d'appels au Forem
  par les crawlers — c'est la charge qu'on refuse de créer.

## Tailles de panneaux

`SheetContent` expose désormais une taille sémantique (`sm`, `md`, `lg`, `xl`,
`2xl`, `full`) et un composite `SheetPanel` impose la structure. Les quatre
panneaux de contenu utilisent `xl`, la navigation mobile `sm`. Plus aucun appel
ne passe sa propre largeur.

## Garde-fous côté serveur

Le détail est récupéré **à la demande**, jamais pour tout le catalogue :

- cache `forem_offer_details` : 7 jours pour un détail Forem, 24 h pour un
  résumé miroir (offre retirée côté Forem) ;
- **single-flight** par offre : dix ouvertures simultanées = un appel ;
- **concurrence bornée** à 2 appels vers le Forem ;
- **stale-while-revalidate** : une entrée périmée est servie immédiatement, le
  rafraîchissement part en tâche de fond ;
- repli sur le miroir si le Forem refuse ou ne connaît plus l'offre.

## Conséquences

**Positives** : lecture rapide sans perte de contexte, liens partageables,
référencement sans marteler un tiers, gabarit homogène.

**Négatives / assumées** : dépendance à un endpoint non documenté (isolée,
cachée, avec repli) ; pas d'URL canonique `/offres/<id>` dans la barre d'adresse
quand le panneau est ouvert (on garde `?offre=`, plus simple et sans toucher au
layout racine). Une route interceptée `@modal` ferait cela, mais ajoute un slot
parallèle au layout pour un gain cosmétique : reportée.

**Non retenu** : ouvrir systématiquement un nouvel onglet. C'est une décision à
la place de l'utilisateur ; le bouton « Ouvrir dans un onglet » la rend possible
sans l'imposer.
