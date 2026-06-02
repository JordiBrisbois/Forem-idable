interface ForemDataAttributionProps {
  adapted?: boolean;
  compact?: boolean;
  className?: string;
}

export function ForemDataAttribution({
  adapted = false,
  compact = false,
  className = "",
}: ForemDataAttributionProps) {
  const rootClassName =
    className ||
    (compact ? "text-xs text-muted-foreground" : "space-y-1 text-xs text-muted-foreground");

  if (compact) {
    return (
      <p className={rootClassName}>
        Données Le Forem / ODWB ·{" "}
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          CC BY-SA 4.0
        </a>
      </p>
    );
  }

  return (
    <div className={rootClassName}>
      <p>
        Données d&apos;offres:{" "}
        <a
          href="https://www.odwb.be/explore/dataset/offres-d-emploi-forem/information/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Le Forem / ODWB
        </a>{" "}
        ·{" "}
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          CC BY-SA 4.0
        </a>
      </p>
      {adapted ? (
        <p>
          Le contenu affiché peut inclure une adaptation de présentation à partir de ces données
          sources.
        </p>
      ) : null}
    </div>
  );
}
