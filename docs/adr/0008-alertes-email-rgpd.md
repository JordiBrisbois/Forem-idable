# ADR-0008 — Alertes email et conformité RGPD

## Contexte

Le miroir local des offres (ADR-0007) permet de savoir **quelles offres sont
nouvelles** : `forem_offers.first_seen_at` est posée à la première insertion et
n'est jamais réécrite. Cette information n'était exploitée que dans l'interface,
alors que le besoin principal d'un chercheur d'emploi est de ne pas devoir
revenir tous les jours.

Contraintes :

- Resend est en **offre gratuite : 100 emails/jour** ; l'instance sert quelques
  testeurs, mais le code doit rester sobre ;
- l'envoi d'emails à des personnes identifiées relève du RGPD (base légale :
  consentement), avec droit de retrait simple et mention du responsable de
  traitement ;
- aucune donnée de navigation ne doit être envoyée au serveur pour savoir ce qui
  est « nouveau » pour un visiteur.

## Décision

Un système d'alertes par recherche enregistrée, découpé en modules :

| Module | Rôle |
|---|---|
| `alerts/repository.ts` | Table `job_alerts`, création/liste/suppression, token de désinscription, sélection des alertes dues. |
| `alerts/service.ts` | Digest : pour chaque alerte due, offres ingérées depuis le dernier envoi, envoi, marquage. |
| `alerts/email.ts` | Construction du message (HTML + texte), lien de désinscription, pied de page RGPD. |
| `alerts/worker.ts` | Planification quotidienne ancrée sur une heure UTC. |
| `mailer.ts` | Client Resend unique, partagé avec la réinitialisation de mot de passe. |

Règles :

- **Opt-in explicite** : l'API refuse un corps sans `consent: true`, et la ligne
  conserve `consent_at`. Maximum 5 alertes par compte (protection du quota).
- **Un seul email par personne et par jour**, même avec plusieurs alertes : les
  alertes sont regroupées en sections, une par recherche. C'est ce qui protège
  le quota Resend (100 emails/jour) et la boîte de réception. Envoi uniquement
  s'il existe des offres ingérées depuis le dernier envoi
  (`first_seen_at > last_sent_at`) ; une alerte sans nouveauté n'est pas marquée
  comme envoyée et reste silencieuse.
- **Désinscription en un clic**, sans session : le token est la capacité
  (`/api/alerts/unsubscribe?token=…`), l'action est idempotente. Chaque email
  porte un lien par alerte **et** un lien « gérer toutes mes alertes ».
- **Gestion dans le compte** : la section `#alertes` de `/account` liste les
  alertes, permet de mettre en pause une alerte et de tout supprimer
  (« me désinscrire de tout »).
- **RGPD** : le message indique la raison de l'envoi, le responsable de
  traitement et le contact ; supprimer l'alerte supprime les données, et la
  suppression du compte les supprime en cascade.
- **Aucune trace côté serveur de la consultation** : « nouvelles offres depuis
  votre dernière visite » s'appuie sur un horodatage stocké dans le navigateur.

## Alternatives envisagées

- **Notification push** : plus intrusive, nécessite un service worker et une
  permission ; hors périmètre pour quelques testeurs.
- **Envoi immédiat à chaque nouvelle offre** : dépasserait 100 emails/jour dès
  qu'une alerte large existe, et noierait l'utilisateur.
- **Journal des offres déjà envoyées** : une table de jointure par alerte et par
  offre. Inutile ici : `first_seen_at` fournit la même garantie sans croissance
  supplémentaire.

## Conséquences

**Positives** : les utilisateurs reviennent sans interroger le site tous les
jours, le coût d'envoi reste borné, et la conformité est vérifiable (consentement
horodaté, retrait en un clic, mentions obligatoires).

**Négatives / assumées** : un email par personne et par jour, donc pas de
fréquence « instantanée » ; le digest dépend de la fraîcheur du miroir (12 h par
défaut) ; Resend reste un dépendance externe, et l'absence de clé désactive
proprement l'envoi (log `digest_skipped`).
