# Politique de sécurité

## Versions supportées

Seule la dernière version de la branche `main` reçoit des correctifs de
sécurité. Les instances auto-hébergées sont responsables de leur mise à jour :
le guide de déploiement est dans [SELF_HOSTING.md](SELF_HOSTING.md).

## Signaler une vulnérabilité

**Merci de ne pas ouvrir d'issue publique** : une issue publique expose les
instances déployées avant qu'un correctif n'existe.

Utilisez les **avis de sécurité GitHub** du dépôt :
onglet *Security* → *Report a vulnerability*
(`https://github.com/JordiBrisbois/Forem-idable/security/advisories/new`).

Un signalement utile contient :

- la version ou le commit concerné ;
- les étapes de reproduction (requête, compte, rôle) ;
- l'impact réel ou supposé (lecture de données, élévation de privilèges, déni
  de service) ;
- si possible une preuve de concept minimale, sans données personnelles réelles.

Accusé de réception sous 72 heures. Le délai de correction suit la gravité :
immédiat pour une fuite de données ou une élévation de privilèges, à la prochaine
livraison pour le reste. Une fois corrigée, la vulnérabilité est publiée en avis
si elle concerne les déploiements existants.

## Périmètre

**Couvert** : le code de ce dépôt (authentification, autorisation, messagerie,
API externe, conformité, configuration runtime).

**Hors périmètre** : les instances déployées par des tiers, leur configuration
(secrets, proxy, base de données), et les vulnérabilités des dépendances amont —
celles-ci doivent être signalées au projet concerné ; le dépôt les suit via
Dependabot et bloque les avis `high`/`critical` en CI (`npm run audit:prod`).

## Attentes de déploiement

- Servir l'instance en **HTTPS** (HSTS est appliqué par l'application).
- Fournir les secrets par variables d'environnement ; aucun `.env` n'est versionné.
- Garder `AUDIT_HASH_SECRET` **stable** : il pseudonymise les identifiants
  utilisateur dans les logs (HMAC-SHA256) ; le changer casse la corrélation
  entre les lignes déjà écrites et les nouvelles.
- Sauvegarder la base ; la procédure est décrite dans `SELF_HOSTING.md`.
