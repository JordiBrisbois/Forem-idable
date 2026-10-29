# Documentation

Point d'entrée de la documentation technique. Les documents de ce dossier
décrivent le **comment** et le **pourquoi** ; le [README](../README.md) reste la
présentation du produit et le guide de démarrage.

| Document | Contenu |
|---|---|
| [architecture.md](architecture.md) | Couches, cycle d'une requête, conventions transverses, ajouter une fonctionnalité |
| [testing.md](testing.md) | Stratégie de test, périmètre de couverture, E2E, CI |
| [security.md](security.md) | Modèle de menace et contrôles (auth, CSRF, RBAC, en-têtes, audit, dépendances) |
| [adr/](adr/) | Décisions d'architecture, une par fichier, avec contexte et conséquences |
| [../DOCAPI.md](../DOCAPI.md) | API externe (endpoints JSON/CSV, authentification par clé) |
| [../SELF_HOSTING.md](../SELF_HOSTING.md) | Déploiement (Docker, VPS, Coolify, sauvegardes) |
| [../COMPLIANCE.md](../COMPLIANCE.md) | Conformité et RGPD (responsable de traitement, rétention, droits) |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Conventions de contribution |

## Conventions de lecture

- Les chemins sont relatifs à la racine du dépôt.
- Les contraintes de sécurité sont écrites comme des **règles**, pas comme des
  suggestions : si un document contredit le code, c'est le code qui a raison et
  le document doit être corrigé dans la même pull request.
- Une décision structurante (choix de bibliothèque, de protocole, de modèle de
  données) va dans un ADR, pas dans un commentaire de code.
