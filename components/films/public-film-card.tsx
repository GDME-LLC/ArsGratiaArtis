import Link from "next/link";

import { LikeButton } from "@/components/engagement/like-button";
import type { PublicFilmCard } from "@/types";

type PublicFilmCardProps = {
  film: PublicFilmCard;
};

export function PublicFilmCard({ film }: PublicFilmCardProps) {
  return (
    <article className="surface-panel cinema-frame overflow-hidden">
      <Link href={`/film/${film.slug}`} className="block">
        <div
          className="aspect-[5/6] w-full bg-cover bg-center"
          style={
            film.posterUrl
              ? {
                  backgroundImage: `linear-gradient(rgba(4,4,6,0.12), rgba(4,4,6,0.58)), url(${film.posterUrl})`,
                }
              : undefined
          }
        >
          {!film.posterUrl ? (
            <div className="flex h-full items-end bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Poster-led release
              </p>
            </div>
          ) : null}
        </div>
        <div className="px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <p className="display-kicker">@{film.creator.handle}</p>
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              {film.commentCount} comment{film.commentCount === 1 ? "" : "s"}
            </p>
          </div>
          <h3 className="title-md mt-2 text-foreground">{film.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
            {film.synopsis || "Synopsis to follow."}
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Open release
          </p>
        </div>
      </Link>
      <div className="px-4 pb-4 sm:px-5">
        <LikeButton
          filmId={film.id}
          initialLikeCount={film.likeCount}
          initialLiked={film.viewerHasLiked}
        />
      </div>
    </article>
  );
}
