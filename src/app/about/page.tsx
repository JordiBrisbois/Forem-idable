import Link from "next/link";
import { runtimeConfig } from "@/config/runtime";
import {
  ContentPageHeader,
  ContentSectionCard,
} from "@/components/content/ContentPageLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const JOB_APIS = [
  {
    title: "Forem Open Data",
    description:
      "Source principale des offres via Opendatasoft (ODWB), utilisée par le module de recherche.",
    href: "https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem",
    hrefLabel: "https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem",
  },
  {
    title: "Nomenclature des localisations",
    description:
      "Utilisée pour enrichir le sélecteur de lieux avec régions, provinces, arrondissements, communes et localités.",
    href: "https://www.leforem.be/recherche-offres/api/Nomenclature/Localisations",
    hrefLabel: "https://www.leforem.be/recherche-offres/api/Nomenclature/Localisations",
  },
  {
    title: "Adzuna",
    description:
      "Source complémentaire multi-offres, activable par variables d'environnement et désactivée par défaut.",
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

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      <ContentPageHeader
        badges={[{ label: "Open Source", variant: "outline" }]}
        title="À propos"
        description={`${projectLabel} est une plateforme d'accompagnement : gestion des coachs et des classes, suivi des candidatures, et un module optionnel de recherche d'offres.`}
      />

      <ContentSectionCard
        title="Objectif du site"
        description="Le rôle du produit et la valeur qu'il apporte."
        contentClassName="flex flex-col gap-4"
      >
        <p className="text-sm leading-6 text-muted-foreground">
          {projectLabel} réunit dans un même espace la gestion des coachs, des classes et des
          bénéficiaires, le suivi des candidatures, la messagerie et — si le module est activé —
          la recherche d&apos;offres. Instance auto-hébergée : chaque établissement personnalise et
          utilise la sienne.
        </p>
        <Alert>
          <AlertTitle>Limites connues</AlertTitle>
          <AlertDescription className="text-sm leading-6">
            Les données d&apos;offres et de localisation, lorsqu&apos;elles sont activées,
            dépendent de fournisseurs externes. Certaines offres peuvent être dupliquées, évoluer
            rapidement, ou ne pas proposer de PDF.
          </AlertDescription>
        </Alert>
      </ContentSectionCard>

      {runtimeConfig.features.jobSearch ? (
        <ContentSectionCard
          title="APIs utilisées"
          description="Les sources externes qui alimentent la recherche et l'enrichissement des données."
          contentClassName="grid gap-4 md:grid-cols-2"
        >
          {JOB_APIS.map((api) => (
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
      ) : null}

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
          Les éventuelles données d&apos;offres issues de jeux de données externes (par exemple
          ODWB / Le Forem) restent publiées sous leurs licences respectives, par exemple{" "}
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
      </ContentSectionCard>

      <ContentSectionCard
        title="Licence et confidentialité"
        description="Cadre légal du projet et informations de confidentialité."
        contentClassName="flex flex-col gap-2 text-sm text-muted-foreground"
      >
        <p>
          Copyright (c) {runtimeConfig.app.currentYear} {runtimeConfig.brand.copyrightName}
        </p>
        <p>Ce projet est distribué sous licence GNU Affero General Public License v3.0.</p>
        {sourceRootUrl ? (
          <p>
            Code source:{" "}
            <a
              href={sourceRootUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              le dépôt source
            </a>
            {" · "}
            <a
              href={sourceDocsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              DOCAPI.md
            </a>
          </p>
        ) : null}
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
