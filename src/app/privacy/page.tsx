import { runtimeConfig } from "@/config/runtime";
import {
  ContentPageHeader,
  ContentSectionCard,
} from "@/components/content/ContentPageLayout";
import { PrivacyConsentControls } from "@/components/consent/PrivacyConsentControls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TextItem = {
  title: string;
  text: string;
};

const DATA_CATEGORIES: TextItem[] = [
  {
    title: "Données de compte",
    text: "Si vous créez un compte, l'application peut traiter votre adresse e-mail, votre nom, votre prénom, votre rôle, votre hash de mot de passe, ainsi que les informations de session nécessaires à l'authentification.",
  },
  {
    title: "Données d'usage métier",
    text: "L'application peut stocker vos candidatures, notes, preuves, dates d'entretien, relances, historique de recherche et, selon votre rôle, des annotations de suivi liées à l'accompagnement coach.",
  },
  {
    title: "Données de synchronisation calendrier",
    text: "Lorsqu'un entretien est planifié, certaines informations strictement utiles à la synchronisation d'agenda peuvent être exposées dans un flux calendrier destiné aux personnes autorisées à suivre un groupe. Cela peut inclure la date et l'heure de l'entretien, l'identité du bénéficiaire, le nom de l'entreprise, le groupe concerné, le lieu et, si vous l'avez renseigné, un court détail d'entretien.",
  },
  {
    title: "Données locales",
    text: "Certaines préférences techniques restent conservées localement dans votre navigateur, comme le thème, l'opérateur booléen par défaut et votre choix de consentement analytics.",
  },
  {
    title: "Synchronisation",
    text: "Si vous vous connectez, vos candidatures et votre historique de recherche sont enregistrés dans la base de données associée à votre compte afin d'être retrouvés sur vos appareils et, le cas échéant, visibles dans le suivi coach selon vos droits.",
  },
  {
    title: "Clés API",
    text: "Pour les comptes coach et admin, l'application peut générer des clés API. Celles-ci sont stockées sous forme de hash, avec des métadonnées minimales comme le nom de la clé, sa date de création, sa dernière utilisation éventuelle, sa révocation et sa date d'expiration si vous en définissez une.",
  },
  {
    title: "Demandes RGPD et journaux de conformité",
    text: "Lorsque vous exportez vos données, demandez la suppression de votre compte, ou lorsqu'une divulgation ciblée doit être documentée, l'application conserve des métadonnées minimales de suivi afin de tracer la demande, son statut, sa date de traitement et, le cas échéant, les restrictions légales applicables.",
  },
  {
    title: "Statistiques optionnelles",
    text: "Des statistiques de fréquentation via Umami peuvent être activées uniquement si vous y consentez. Elles ne sont pas nécessaires à l'utilisation du service.",
  },
  {
    title: "Emails transactionnels",
    text: "Si la fonction de réinitialisation de mot de passe est activée, votre adresse email peut être utilisée pour vous envoyer un lien de changement de mot de passe via le prestataire technique Resend.",
  },
];

const LEGAL_BASIS: TextItem[] = [
  {
    title: "Fournir le service",
    text: "Recherche d'offres, suivi des candidatures, historique de recherche, accès au compte et accès aux fonctions du compte. Base juridique principale: exécution du service demandé et, selon les cas, mesures précontractuelles.",
  },
  {
    title: "Sécurité et intégrité",
    text: "Gestion des sessions (7 jours, renouvellement glissant), prévention des abus par rate limiting, journalisation technique minimale avec pseudonymisation des identifiants, protection des accès et des exportations API. Base juridique principale: intérêt légitime à sécuriser le service.",
  },
  {
    title: "Coordination des entretiens",
    text: "Mise à disposition, pour les personnes autorisées au suivi d'un groupe, d'un flux calendrier permettant de synchroniser les entretiens programmés dans un agenda externe. Base juridique principale: intérêt légitime à organiser l'accompagnement, la coordination et le suivi opérationnel, dans le respect du principe de minimisation.",
  },
  {
    title: "Réinitialisation de mot de passe",
    text: "Envoi d'un email contenant un lien temporaire lorsque vous demandez explicitement un changement de mot de passe. Base juridique principale: exécution du service demandé et sécurisation de l'accès à votre compte.",
  },
  {
    title: "Statistiques facultatives",
    text: "Mesure d'usage via Umami. Base juridique: votre consentement, que vous pouvez retirer ou modifier à tout moment sur cette page.",
  },
  {
    title: "Respect des obligations légales",
    text: "Certaines données peuvent être conservées si une obligation légale l'impose ou si cela est strictement nécessaire pour gérer un litige ou défendre des droits.",
  },
  {
    title: "Gestion des droits et demandes légales",
    text: "Les demandes d'export, de suppression, de gel de conservation et les divulgations ciblées à une autorité font l'objet d'un traitement encadré, limité au strict nécessaire et journalisé lorsqu'une traçabilité est requise.",
  },
];

const ACCESS_AND_RETENTION = [
  {
    title: "Destinataires et accès aux données",
    paragraphs: [
      "Les données ne sont pas vendues. Elles peuvent être accessibles, dans la limite du nécessaire, au responsable du traitement et aux prestataires techniques indispensables au fonctionnement de l'application, comme l'hébergement, la base de données et les composants d'analyse activés avec consentement.",
      "Certaines fonctionnalités donnent aussi accès aux données à d'autres utilisateurs autorisés dans l'application, notamment dans le cadre du suivi de groupes, des candidatures et, le cas échéant, de la synchronisation calendrier des entretiens.",
      "Si un transfert hors de l'Espace économique européen devait intervenir via un prestataire technique, il devrait être encadré par les garanties appropriées prévues par le RGPD.",
      "Si vous ou une personne autorisée choisissez d'abonner un agenda tiers, comme Google Calendar, Outlook ou Apple Calendar, les données incluses dans le flux calendrier seront également traitées par ce service tiers selon ses propres conditions et sa propre politique de confidentialité.",
    ],
  },
  {
    title: "Durées de conservation",
    paragraphs: [
      "Les données locales restent dans votre navigateur jusqu'à leur suppression par vos soins, par effacement manuel du navigateur ou via les fonctions prévues dans l'application.",
      "Les données associées à un compte connecté sont conservées tant que le compte reste actif ou jusqu'à demande de suppression. Une demande de suppression peut nécessiter une revue manuelle avant traitement effectif et rester suspendue si une obligation légale, un litige ou un legal hold l'impose.",
      "Les sessions expirent automatiquement après 7 jours (renouvelées à chaque utilisation). Les clés API peuvent être révoquées à tout moment et peuvent aussi expirer automatiquement si une date d'expiration a été définie.",
      "Les exports de données générés pour un utilisateur sont temporaires et supprimés après leur durée de disponibilité. L'historique de recherche est purgé au-delà de la durée configurée. Le contenu des messages est effacé après 18 mois d'inactivité de la conversation.",
      "Les journaux d'audit (traçabilité des actions administratives et coach) sont conservés jusqu'à 24 mois. Lors de la suppression effective d'un compte, les identifiants personnels dans ces journaux sont anonymisés, sauf si une obligation légale (legal hold) impose leur conservation.",
      "Les flux calendrier reflètent l'état courant des entretiens enregistrés dans l'application. Lorsqu'un entretien est modifié ou supprimé, la source est mise à jour côté FOREM-idable, mais la disparition effective dans un agenda tiers dépend du délai de resynchronisation appliqué par ce service tiers.",
    ],
  },
];

const RIGHTS = [
  "Vous pouvez demander l'accès à vos données, leur rectification, leur effacement, la limitation de certains traitements, leur portabilité lorsque c'est applicable, ou vous opposer à un traitement fondé sur l'intérêt légitime.",
  "Depuis votre espace compte, vous pouvez initier un export JSON de vos données ainsi qu'une demande de suppression de compte. Ces demandes peuvent faire l'objet d'une revue manuelle avant leur traitement effectif.",
  "Lorsque le traitement repose sur votre consentement, vous pouvez le retirer à tout moment pour l'avenir, sans remettre en cause la licéité du traitement réalisé avant ce retrait.",
  "Lorsqu'une conservation ciblée est légalement nécessaire, certaines données peuvent être temporairement gelées via un legal hold afin d'empêcher leur suppression ou leur purge anticipée.",
  "Lorsqu'une divulgation ciblée est réalisée à la suite d'une demande d'autorité ou d'une contrainte légale, l'opération est journalisée afin d'en conserver la traçabilité.",
];

function SectionList({
  items,
  className = "flex flex-col gap-4",
}: {
  items: TextItem[];
  className?: string;
}) {
  return (
    <div className={className}>
      {items.map((item) => (
        <div key={item.title} className="flex flex-col gap-1 text-sm leading-6 text-muted-foreground">
          <p className="font-semibold text-foreground">{item.title}</p>
          <p>{item.text}</p>
        </div>
      ))}
    </div>
  );
}

function TextCardGrid({ items }: { items: TextItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item, index) => (
        <Card key={item.title} className="bg-muted/30 shadow-none">
          <CardHeader className="gap-2">
            <CardTitle className="text-base">
              {index + 1}. {item.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
            {item.text}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function PrivacyPage() {
  const { controllerName, contactEmail, sourceUrl, lastUpdatedLabel } = runtimeConfig.privacy;
  const projectLabel = runtimeConfig.app.name;
  const sourceRootUrl = sourceUrl.replace(/\/+$/, "");
  const isGitHubSourceRoot = /^https:\/\/github\.com\/[^/]+\/[^/]+$/i.test(sourceRootUrl);
  const docsUrl = isGitHubSourceRoot ? `${sourceRootUrl}/blob/main/DOCAPI.md` : sourceRootUrl;
  const complianceUrl = isGitHubSourceRoot
    ? `${sourceRootUrl}/blob/main/COMPLIANCE.md`
    : sourceRootUrl;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      <ContentPageHeader
        badges={[
          { label: "RGPD", variant: "outline" },
          { label: "Transparence", variant: "secondary" },
        ]}
        title="Confidentialité"
        description={`Cette page explique quelles données peuvent être traitées par ${projectLabel}, pourquoi, sur quelle base et comment exercer vos droits.`}
      />

      <ContentSectionCard
        title="Cadre général"
        description="Contexte du projet et responsable du traitement."
        contentClassName="grid gap-8 lg:grid-cols-2"
      >
          <div className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
            <p>
              {projectLabel} est un projet gratuit et open source, mis à disposition sous licence
              GNU Affero General Public License v3.0. L&apos;application permet de rechercher des
              offres d&apos;emploi, de suivre des candidatures, et, si vous créez un compte,
              d&apos;enregistrer ces données dans votre espace personnel.
            </p>
            <p>
              La présente politique de confidentialité est rédigée en tenant compte du Règlement
              général sur la protection des données (RGPD) et des principes rappelés par
              l&apos;Autorité de protection des données belge.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm leading-6 text-muted-foreground">
            <p className="font-semibold text-foreground">{controllerName}</p>
            <p>Projet: {projectLabel}</p>
            <p>
              Contact RGPD:{" "}
              <a className="text-primary hover:underline" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
            </p>
            <p>
              Code source:{" "}
              <a
                className="break-all text-primary hover:underline"
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {sourceUrl}
              </a>
            </p>
          </div>
      </ContentSectionCard>

      <ContentSectionCard
        title="Données traitées"
        description="Les catégories de données potentiellement concernées par le fonctionnement du service."
      >
        <TextCardGrid items={DATA_CATEGORIES} />
      </ContentSectionCard>

      <ContentSectionCard title="Finalités et bases juridiques">
        <SectionList items={LEGAL_BASIS} />
      </ContentSectionCard>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Accès, conservation et droits</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 text-sm leading-6 text-muted-foreground">
            {ACCESS_AND_RETENTION.map((section) => (
              <div key={section.title} className="flex flex-col gap-3">
                <p className="font-semibold text-foreground">{section.title}</p>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph.replaceAll("FOREM-idable", projectLabel)}</p>
                ))}
              </div>
            ))}

            <div className="flex flex-col gap-3">
              <p className="font-semibold text-foreground">Vos droits</p>
              {RIGHTS.map((item) => (
                <p key={item}>{item}</p>
              ))}
              <p>
                Pour exercer vos droits, vous pouvez écrire à{" "}
                <a className="text-primary hover:underline" href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
                .
              </p>
              <p>
                Vous avez également le droit d&apos;introduire une plainte auprès de l&apos;Autorité
                de protection des données belge:{" "}
                <a
                  className="text-primary hover:underline"
                  href="https://www.autoriteprotectiondonnees.be"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.autoriteprotectiondonnees.be
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Choix des statistiques</CardTitle>
              <CardDescription>
                Les statistiques restent facultatives et configurables à tout moment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PrivacyConsentControls />
            </CardContent>
          </Card>

          <Alert>
            <AlertTitle>Transparence technique</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 text-sm leading-6">
              <p>
                {projectLabel} est open source. Si vous préférez garder un contrôle complet sur
                l&apos;hébergement, le code peut être audité, adapté ou auto-hébergé.
              </p>
              <p>
                Une documentation dédiée à l&apos;API externe est disponible dans{" "}
                <a
                  className="text-primary hover:underline"
                  href={docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  DOCAPI.md
                </a>
                . Une note complémentaire sur l&apos;export de données, les demandes de suppression,
                les legal holds et la purge de rétention est disponible dans{" "}
                <a
                  className="text-primary hover:underline"
                  href={complianceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  COMPLIANCE.md
                </a>
                .
              </p>
            </AlertDescription>
          </Alert>

          <Card className="shadow-sm">
            <CardHeader>
            <CardTitle>Mise à jour</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
              Dernière mise à jour: {lastUpdatedLabel}. Cette page peut être adaptée si les fonctionnalités,
              les traitements ou les obligations légales applicables évoluent.
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
