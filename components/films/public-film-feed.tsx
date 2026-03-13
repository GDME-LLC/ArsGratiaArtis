import Link from "next/link";

import { PublicFilmCard } from "@/components/films/public-film-card";
import { Button } from "@/components/ui/button";
import type { PublicFilmCard as PublicFilmCardType } from "@/types";

type PublicFilmFeedProps = {
  films: PublicFilmCardType[];
  hasMore?: boolean;
  nextPageHref?: string;
};

export function PublicFilmFeed({
  films,
  hasMore = false,
  nextPageHref,
}: PublicFilmFeedProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {films.map((film) => (
          <PublicFilmCard key={film.id} film={film} />
        ))}
      </div>

      {hasMore && nextPageHref ? (
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg" variant="ghost">
            <Link href={nextPageHref}>Load More</Link>
          </Button>
        </div>
      ) : null}
    </>
  );
}
