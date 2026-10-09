# Architecture Decision Records

Ce dossier conserve les décisions d'architecture structurantes (ADR) : **le
contexte**, **la décision**, **les conséquences**. Elles documentent surtout les
choix « faits maison » : ils sont **volontaires**, et cet index explique pourquoi.

| # | Décision | Statut |
|---|---|---|
| [0001](0001-auth-maison.md) | Authentification, sessions et CSRF faits maison | Accepté |
| [0002](0002-wrappers-api.md) | Wrappers de routes API + autorisation centralisée | Accepté |
| [0003](0003-config-runtime.md) | Configuration white-label injectée au runtime | Accepté |
| [0004](0004-vocabulaire-classe.md) | Vocabulaire UI « classe » / modèle technique « group » | Accepté |
| [0005](0005-tables-mortes.md) | Suppression des tables inutilisées | Accepté |

## Format

Un ADR est **immuable** une fois accepté : pour changer une décision, on ajoute un
nouvel ADR qui « supersede » l'ancien. Format : Contexte · Décision · Alternatives ·
Conséquences.

## Pourquoi documenter le « fait maison »

Plusieurs briques clés (auth, CSRF, injection de configuration, wrappers de routes)
sont implémentées à la main plutôt que via des bibliothèques. C'est un **choix
assumé**, motivé par le contrôle, la surface réduite et la portabilité
auto-hébergée — voir ADR-0001. Les ADR rendent ce raisonnement explicite pour un
relecteur externe, qui peut alors juger le compromis plutôt que supposer un oubli.
