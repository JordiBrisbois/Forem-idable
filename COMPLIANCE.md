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

- middleware global d'authentification sur les routes protégées
- rate limiting sur les endpoints sensibles (authentification, messages)
- validation des origines (CSRF) sur les routes mutantes
- échappement du contenu des messages côté serveur (prévention XSS)
- durée de session limitée à 7 jours avec renouvellement glissant à chaque utilisation

## Hors périmètre de cette phase

- centre admin complet de gestion conformité
- workflow juridique complet ou validation par conseil externe
- chiffrement applicatif spécifique des messages
