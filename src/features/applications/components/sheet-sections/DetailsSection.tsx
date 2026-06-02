interface DetailsSectionProps {
  title: string;
  children: React.ReactNode;
}

export function DetailsSection({ title, children }: DetailsSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-medium">{title}</h3>
      {children}
    </section>
  );
}
