import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfferNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <SearchX className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-semibold">Cette offre n&apos;est plus disponible</h1>
      <p className="text-sm text-muted-foreground">
        Elle a peut-être été pourvue ou retirée par l&apos;employeur. La recherche vous montrera
        les offres encore ouvertes.
      </p>
      <Button asChild>
        <Link href="/">Revenir à la recherche</Link>
      </Button>
    </div>
  );
}
