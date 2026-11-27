# Compliance Notes

Cette note documente le périmètre de la conformité implémentée dans le projet.

## Couverture actuelle

- export JSON des données utilisateur depuis `Mon compte`
- demande de suppression de compte avec revue manuelle
- `legal holds` administratifs pour geler une suppression ou une purge
- journalisation des divulgations administratives
- purge minimale via `npm run maintenance:purge`
- anonymisation des journaux d'audit (`audit_logs`) lors de la suppression d'un compte
- pseudonymisation (hash HMAC) des identifiants utilisateur dans les logs opérationnels
- respect des `legal holds` actifs lors des purges automatiques

## Rétention minimale

- `sessions`: suppression des sessions expirées (durée de vie: 7 jours avec extension glissante)
- `password_reset_tokens`: suppression des jetons expirés ou utilisés au-delà de la fenêtre de rétention
- `user_search_history`: purge basée sur l'ancienneté
- `data_export_requests`: purge des exports expirés
- `conversation_messages`: contenu effacé (soft-delete) après 18 mois d'inactivité de la conversation
- `audit_logs`: purge après 24 mois, sauf si un `legal hold` actif concerne l'utilisateur concerné

Variables d'environnement optionnelles:

- `PASSWORD_RESET_RETENTION_DAYS`
- `SEARCH_HISTORY_RETENTION_DAYS`
- `DATA_EXPORT_RETENTION_DAYS`
- `MESSAGE_RETENTION_MONTHS`
- `AUDIT_LOG_RETENTION_MONTHS`

## Principes

- pas d'accès direct à la base pour une demande d'autorité
- export ciblé et journalisé plutôt qu'extraction ad hoc
- suppression utilisateur bloquée si un `legal hold` actif existe
- conservation minimale et purge planifiée des données temporaires
- les logs opérationnels ne contiennent pas d'identifiants utilisateur en clair (hash HMAC)
- les journaux d'audit sont anonymisés (`actor_user_id` et `target_user_id` mis à `NULL`) lors de la suppression effective d'un compte, sauf obligation légale contraire

## Sécurité et intégrité

- middleware de routage qui vérifie la **présence** du cookie de session sur les routes
  protégées (la validation de session et l'autorisation réelles sont faites dans les routes API)
- rate limiting sur les endpoints sensibles (authentification, messages)
- validation des origines (CSRF) sur les routes mutantes
- échappement du contenu des messages côté serveur (prévention XSS)
- durée de session limitée à 7 jours avec renouvellement glissant à chaque utilisation

## Alertes email

Les alertes sur recherche enregistrée sont un traitement de prospection
fonctionnelle, fondé sur le **consentement** de la personne :

- **Opt-in explicite** : la case à cocher est obligatoire, le consentement est
  horodaté en base (`job_alerts.consent_at`) et l'API refuse toute création sans
  `consent: true` ;
- **Minimisation** : seuls l'adresse email (déjà détenue pour le compte) et les
  critères de recherche sont stockés ; aucune donnée de navigation n'est
  transmise pour calculer les « nouveautés » ;
- **Droit de retrait** : lien de désinscription en un clic dans chaque email,
  sans authentification, avec un token dédié ; l'alerte passe en inactif
  immédiatement. La page `/account#alertes` permet en plus de mettre une alerte
  en pause ou de supprimer toutes les alertes ;
- **Un seul email par jour et par personne**, quel que soit le nombre d'alertes
  (elles sont regroupées en sections) : limitation du volume d'envoi et du
  quota ;
- **Effacement** : supprimer une alerte supprime ses données, supprimer le
  compte les supprime en cascade ; aucune copie n'est conservée ;
- **Information** : chaque email rappelle la raison de l'envoi, le responsable de
  traitement, le contact et la durée de conservation.

Le fournisseur d'envoi (Resend) agit comme sous-traitant : seuls l'adresse, le
contenu du message et l'identifiant technique lui sont transmis.

## Hors périmètre de cette phase

- centre admin complet de gestion conformité
- workflow juridique complet ou validation par conseil externe
- chiffrement applicatif spécifique des messages
