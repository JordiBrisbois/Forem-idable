# Architecture — panneau d'offre et page publique

## Composants

```
components/ui/
  sheet.tsx            primitive + tailles sémantiques (sm…full)
  sheet-panel.tsx      composite : en-tête fixe / corps défilant / pied collant

features/jobs/
  hooks/useOfferPanel.ts     résout l'offre depuis ?offre= (liste ou API)
  hooks/useOfferDetails.ts   cache module, single-flight, prefetch
  components/offer-panel/
    OfferPanel.tsx           hôte Sheet (chrome, actions)
    OfferDetailView.tsx      contenu partagé avec la page + squelette

app/offres/[id]/page.tsx     page publique (JSON-LD, canonical)
app/api/offers/[id]/route.ts API de détail (cache, rate limit)
lib/server/offers/
  detail.ts                  normalisation Forem, HTML → texte
  detailService.ts           cache, SWR, single-flight, concurrence
```

## Contrat d'URL

| Paramètre | Rôle |
|---|---|
| `kw`, `bm`, `goal`, `loc`, `ct` | recherche |
| `tri`, `page`, `taille`, `regime`, `secteur`, `langue`, `lat`, `lon`, `rayon` | vue des résultats |
| `offre` | offre ouverte dans le panneau |

`?offre=` est écrit par `useHomePageState` (`openJobDetails` / `closeJobDetails`)
et relu par `useOfferPanel`. Toute modification de recherche ou de vue ferme le
panneau : le lien reste cohérent avec la liste affichée.

## Cache

| Niveau | Durée | Où |
|---|---|---|
| Client (module) | 10 min | `useOfferDetails` |
| HTTP | 5 min | `cache-control` de la route |
| Serveur (Postgres) | 7 j (Forem) / 24 h (miroir) | `forem_offer_details` |
| Page publique | rendu dynamique | `dynamic = "force-dynamic"` |

Un appel au Forem n'a lieu que sur cache manquant ou périmé (rafraîchissement en
tâche de fond). Aucun préchargement n'est déclenché par l'affichage d'une liste.

## Accessibilité

Le panneau est un `Dialog` Radix : titre (`SheetTitle`) et description
(`SheetDescription`) obligatoires, piège de focus, fermeture par `Échap`, retour
du focus sur la ligne déclencheuse (`closeJobDetails`). La page publique a un
`h1` unique et un lien de retour.

## SEO

- `generateMetadata` : titre, description tronquée, canonical, Open Graph.
- JSON-LD `JobPosting` : `datePosted`, `validThrough`, `employmentType`,
  `hiringOrganization`, `jobLocation`, `directApply: false`.
- `sitemap.xml` : accueil + pages statiques + offres **déjà en cache**.
- `robots.txt` : les espaces privés (`/admin`, `/account`, `/api`…) sont exclus.
