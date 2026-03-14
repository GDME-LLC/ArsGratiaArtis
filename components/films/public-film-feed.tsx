import Link from "next/link";

import { PublicFilmCard } from "@/components/films/public-film-card";
import { HorizontalRail } from "@/components/shared/horizontal-rail";
import { Button } from "@/components/ui/button";
import type { PublicFilmCard as PublicFilmCardType } from "@/types";

type PublicFilmFeedProps = {
  films: PublicFilmCardType[];
  hasMore?: boolean;
  nextPageHref?: string;
  variant?: "grid" | "row";
};

export function PublicFilmFeed({
  films,
  hasMore = false,
  nextPageHref,
  variant = "grid",
}: PublicFilmFeedProps) {
  if (variant === "row") {
    return (
      <>
        <HorizontalRail ariaLabel="film releases">
          {films.map((film) => (
            <div key={film.id} className="w-[min(76vw,18rem)] shrink-0 snap-start sm:w-[17rem] lg:w-[18rem]">
              <PublicFilmCard film={film} />
            </div>
          ))}
        </HorizontalRail>

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
