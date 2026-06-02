import { Badge } from "@/components/ui/badge";

const valueProps = [
  "Recherche avancée",
  "Filtres géographiques",
  "Suivi des candidatures",
  "Relances et entretiens",
];

export function HomePageHero() {
  return (
    <section className="flex flex-col gap-4 rounded-[28px] border border-border/60 bg-linear-to-br from-card via-card to-muted/20 p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap gap-2">
        {valueProps.map((item, index) => (
          <Badge
            key={item}
            variant="outline"
            className={`rounded-full bg-background/70 px-3 py-1 ${index > 1 ? "hidden sm:inline-flex" : ""}`}
          >
            {item}
          </Badge>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="max-w-4xl text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Trouvez votre prochain défi sans perdre le fil de vos candidatures.
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Recherchez parmi des milliers d&apos;offres en Wallonie et au-delà, comparez les pistes
          utiles, puis passez directement de la veille au suivi personnel ou coach.
        </p>
      </div>
    </section>
  );
}
