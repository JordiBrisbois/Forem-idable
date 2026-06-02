import Link from "next/link";
import { runtimeConfig } from "@/config/runtime";
import {
  ContentPageHeader,
  ContentSectionCard,
} from "@/components/content/ContentPageLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PRODUCT_UPDATES = [
  {
    month: "Avril 2026",
    items: [
      "Barre d'actions en masse flottante sur les candidatures: sélection multiple, tout sélectionner/désélectionner, désactiver ou réactiver les relances, changer le statut en masse et supprimer — avec confirmation via AlertDialog shadcn pour chaque action destructrice.",
      "Les bénéficiaires ayant trouvé un stage (au moins une candidature acceptée) n'apparaissent plus dans les «Suivis à relancer» de la vue coach — ils n'ont plus besoin d'être relancés.",
      "Les bénéficiaires dont toutes les candidatures sont clôturées (uniquement des refus, aucune candidature active) sont exclus des «Suivis à relancer» — relancer n'a plus de sens.",
      "Badge «A trouvé un stage» dans les priorités coach pour les bénéficiaires apparaissant dans les relances à traiter tout en ayant une candidature acceptée.",
    ],
  },
  {
    month: "Mars 2026",
    items: [
      "Le pack conformité est désormais outillé de bout en bout: export JSON des données utilisateur, demande de suppression avec revue admin, legal holds, disclosure logs, purge minimale planifiable et section admin dédiée avec sélecteurs assistés pour cibler utilisateurs, candidatures et conversations.",
      "Arrivée de la page `/messages` avec conversations de groupe et messages privés (DM) entre personnes autorisées, accès direct depuis la navigation principale et base de messagerie dédiée côté serveur.",
      "Messagerie enrichie avec parsing des liens d'offres FOREM dans le chat: un lien offre valide est transformé en carte lisible avec les informations utiles et une action directe pour ajouter l'offre au suivi des candidatures.",
      "UX mobile des messages retravaillée pour les démos: affichage plein écran du fil, suppression du footer parasite sur `/messages`, header DM resserré et comportement de scroll fiabilisé sur l'ouverture d'une conversation.",
      "Refonte de la structure de données des candidatures: sortie progressive du blob JSONB vers un modèle relationnel avec tables dédiées pour les candidatures, snapshots d'offres, note privée coach, notes partagées multiples, contributeurs et événements, sans perte de données grâce à une migration additive.",
      "Refonte complète de l'API externe pour les usages Excel / Power Query: filtres métier enrichis (nom, prénom, email, groupe, entreprise, notes), `format=json|csv` sur les listes, `applicationId` exposé, upsert de candidature et endpoints d'écriture pour la note privée et les notes partagées.",
      "Refonte de la vue coach/admin pour les démos: hiérarchie de page clarifiée, KPI rééquilibrés, sections Priorités / Activité / Groupes mieux structurées, module d'administration coach repositionné et système de badges métier harmonisé (relances, entretiens, acceptées, refusées).",
      "Durcissement de la résilience UI avec des error boundaries segmentaires (`error.tsx`) sur les pages majeures, complétés par un `global-error.tsx` racine et un `not-found.tsx` dédié.",
      "Ajout d'un socle E2E Playwright sur le Happy Path principal (recherche d'offre -> ajout au suivi -> visibilité côté coach) pour démontrer la couverture du coeur métier.",
      "Refactor de la page d'accueil `/`: orchestration sortie dans un hook dédié, composants d'assemblage clarifiés, wrappers homogénéisés et structure plus lisible sans perte des comportements métier.",
      "Polish visuel de la home pour les démos: hero produit plus net, panneaux résultats/historique/sélection plus cohérents, et présentation plus propre des blocs de recherche.",
      "Adoption d'un système de feedback global par toasts (`sonner`) pour les retours transitoires de succès/erreur sur les parcours compte, auth, reset-password et coach.",
      "Refactor complet de la page Candidatures: orchestration simplifiée, logique dérivée extraite dans des utilitaires et un hook dédié, composants découpés par responsabilité, duplication réduite et couverture de tests renforcée.",
      "Homogénéisation de l'UI Candidatures avec des formulaires et confirmations alignés sur les primitives shadcn (Field, AlertDialog), badges unifiés et cartes mieux alignées visuellement.",
      "Nettoyage du shell global de l'application: header mobile et footer dédiés, sidebar restructurée autour d'une configuration testable, navigation plus lisible et layout racine clarifié.",
      "Passage du rate limiting sur un backend Redis optionnel avec fallback mémoire, et durcissement des seuils sur login, inscription, réinitialisation de mot de passe et API externe.",
      "Renforcement de la couche data avec Drizzle côté services auth/API keys, migrations versionnées et validation runtime Zod des payloads JSONB sensibles.",
      "Alignement de l'API externe et de sa documentation avec les nouveaux scopes coach/admin, les groupes attribués, les coachs de groupe et la notion de manager.",
      "Évolution du module coach: attribution multi-coachs par groupe, manager de groupe, visibilité limitée aux groupes attribués et gestion admin dédiée des coachs.",
      "Ajout de l'import CSV côté coach avec modèle téléchargeable, auto-détection des colonnes, mapping manuel, correction des statuts non reconnus, gestion des doublons et choix explicite du format de date.",
      "Dashboard coach enrichi avec sections À traiter et Activité récente, plus édition et suppression de candidatures directement depuis chaque bloc candidature dans le sidepanel bénéficiaire.",
      "Ajout d'une synchronisation calendrier coach via lien d'abonnement ICS par groupe standard ou au global, avec aide intégrée, respect du périmètre visible par le compte courant et régénération réservée aux admins.",
      "UX affinée sur les actions coach et candidatures: boutons regroupés dans des menus Actions, side panels homogénéisés et toolbar mobile plus compacte.",
      "Ajout d'un flux mot de passe oublié via email avec Resend, feature flag dédié et page de réinitialisation.",
      "Vue coach affinée: side panel plus large, candidatures repliables, note privée coach commune, notes partagées multiples avec auteurs/contributeurs, badges Manuelle/Importée et exports enrichis.",
      "Ajout d'une page Confidentialité, d'un consentement statistiques clarifié et de variables d'environnement dédiées pour personnaliser les informations RGPD.",
      "Mise en place d'une API externe sécurisée pour les comptes coach et admin, avec clés API Bearer et exports JSON / CSV compatibles Excel et Power Query.",
      "Arrivée des rôles user, coach et admin, avec gestion de groupes, suivi des candidatures et exports coach par utilisateur ou par groupe.",
      "Ajout du suivi complet des candidatures: relances, entretiens, export CSV, compte obligatoire pour le suivi et interface dédiée.",
      "Tracking optionnel via Umami, activable par variables d'environnement.",
      "Documentation de configuration enrichie (`README` + `env.example`) pour les variables Umami.",
      "Nettoyage du lint sur la table des offres avec une règle ciblée de compatibilité React Compiler/TanStack.",
    ],
  },
  {
    month: "Février 2026",
    items: [
      "Recherche élargie avec plus de résultats chargés par défaut.",
      "Pagination enrichie avec navigation rapide (première, dernière et plage dynamique de pages).",
      "Chargement progressif des résultats supplémentaires via le bouton \"Charger plus\".",
    ],
  },
];

const APIS = [
  {
    title: "Forem Open Data",
    description:
      "Source principale des offres via Opendatasoft (ODWB), utilisée pour la recherche centrale.",
    href: "https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem",
    hrefLabel:
      "https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem",
  },
  {
    title: "Nomenclature Forem des localisations",
    description:
      "Utilisée pour enrichir le sélecteur de lieux avec régions, provinces, arrondissements, communes et localités.",
    href: "https://www.leforem.be/recherche-offres/api/Nomenclature/Localisations",
    hrefLabel: "https://www.leforem.be/recherche-offres/api/Nomenclature/Localisations",
  },
  {
    title: "PDF d'offres Forem",
    description:
      "Le site passe par un proxy serveur pour récupérer les documents PDF lorsqu'ils sont disponibles.",
    href: "https://www.leforem.be/recherche-offres/api/Document/PDF/{offreId}",
    hrefLabel: "https://www.leforem.be/recherche-offres/api/Document/PDF/{offreId}",
  },
  {
    title: "Adzuna",
    description:
      "Source complémentaire multi-offres activable par variables d'environnement et désactivée par défaut.",
    href: "https://developer.adzuna.com/docs/search",
    hrefLabel: "https://developer.adzuna.com/docs/search",
  },
];

export default function AboutPage() {
  const { sourceUrl } = runtimeConfig.privacy;
  const projectLabel = runtimeConfig.app.name;
  const sourceRootUrl = sourceUrl.replace(/\/+$/, "");
  const isGitHubSourceRoot = /^https:\/\/github\.com\/[^/]+\/[^/]+$/i.test(sourceRootUrl);
  const sourceDocsUrl = isGitHubSourceRoot ? `${sourceRootUrl}/blob/main/DOCAPI.md` : sourceRootUrl;
  const sourceCommitsUrl = isGitHubSourceRoot ? `${sourceRootUrl}/commits/main/` : sourceRootUrl;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      <ContentPageHeader
        badges={[
          { label: "Open Source", variant: "outline" },
          { label: "Data-driven", variant: "secondary" },
        ]}
        title="À propos"
        description={`${projectLabel} est un agrégateur orienté recherche d'emploi, pensé pour rendre la recherche plus lisible, le filtrage plus utile et le suivi des candidatures plus concret.`}
      />

      <ContentSectionCard
        title="Objectif du site"
        description="Le rôle du produit et la valeur qu'il apporte."
        contentClassName="flex flex-col gap-4"
      >
          <p className="text-sm leading-6 text-muted-foreground">
            {projectLabel} centralise la recherche d&apos;offres, fiabilise le filtrage géographique
            et transforme une navigation brute en parcours de suivi plus exploitable. Le produit
            réunit dans un même espace la consultation des offres, l&apos;accès aux PDF disponibles,
            le suivi des candidatures et une lecture plus claire des prochaines relances.
          </p>
          <Alert>
            <AlertTitle>Limites connues</AlertTitle>
            <AlertDescription className="text-sm leading-6">
              Les données d&apos;offres et de localisation dépendent de fournisseurs externes.
              Certaines offres peuvent être dupliquées, évoluer rapidement, ou ne pas proposer de
              PDF.
            </AlertDescription>
          </Alert>
      </ContentSectionCard>

      <ContentSectionCard
        title="APIs utilisées"
        description="Les sources externes qui alimentent la recherche et l'enrichissement des données."
        contentClassName="grid gap-4 md:grid-cols-2"
      >
          {APIS.map((api) => (
            <Card key={api.title} className="shadow-none">
              <CardHeader className="gap-2">
                <CardTitle className="text-base">{api.title}</CardTitle>
                <CardDescription>{api.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-xs">
                <a
                  href={api.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-primary hover:underline"
                >
                  {api.hrefLabel}
                </a>
              </CardContent>
            </Card>
          ))}
      </ContentSectionCard>

      <ContentSectionCard
        title="Nouveautés récentes"
        description="Les évolutions récentes du projet, regroupées par période."
        contentClassName="flex flex-col gap-4"
      >
          <Accordion type="multiple" className="rounded-xl border px-4">
            {PRODUCT_UPDATES.map((group) => (
              <AccordionItem key={group.month} value={group.month}>
                <AccordionTrigger>{group.month}</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3">
                    {group.items.map((item) => (
                      <div
                        key={`${group.month}-${item}`}
                        className="flex gap-3 text-sm text-muted-foreground"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="text-sm text-muted-foreground">
            Historique complet:{" "}
            <a
              href={sourceCommitsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              commits sur GitHub
            </a>
          </div>
      </ContentSectionCard>

      <ContentSectionCard
        title="Licences du code et des données"
        description="Séparation entre la licence du logiciel et celle des contenus externes affichés."
        contentClassName="flex flex-col gap-3 text-sm text-muted-foreground"
      >
          <p>
            Le code de l&apos;application {projectLabel} est publié sous licence GNU Affero General
            Public License v3.0.
          </p>
          <p>
            Les données d&apos;offres issues du jeu de données ODWB / Le Forem sont publiées sous{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              CC BY-SA 4.0
            </a>
            .
          </p>
          <p>
            Lorsqu&apos;une offre Forem est affichée, l&apos;application peut reformater ou structurer
            certaines informations pour en faciliter la lecture. Les contenus sources restent
            attribués à Le Forem / ODWB.
          </p>
          <p>
            Source de référence du dataset:{" "}
            <a
              href="https://www.odwb.be/explore/dataset/offres-d-emploi-forem/information/"
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-primary hover:underline"
            >
              offres-d-emploi-forem sur ODWB
            </a>
            .
          </p>
      </ContentSectionCard>

      <ContentSectionCard
        title="Licence et confidentialité"
        description="Cadre légal du projet et informations de confidentialité."
        contentClassName="flex flex-col gap-2 text-sm text-muted-foreground"
      >
          <p>Copyright (c) {runtimeConfig.app.currentYear} {runtimeConfig.brand.copyrightName}</p>
          <p>Ce projet est distribué sous licence GNU Affero General Public License v3.0.</p>
          <p>
            Le code source correspondant est publié sur{" "}
            <a
              href={sourceRootUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              le dépôt source
            </a>
            .
          </p>
          <p>
            Documentation technique:{" "}
            <a
              href={sourceDocsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              DOCAPI.md
            </a>
            .
          </p>
          <p>
            La politique de confidentialité est disponible sur{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              la page Confidentialité
            </Link>
            .
          </p>
      </ContentSectionCard>
    </div>
  );
}
