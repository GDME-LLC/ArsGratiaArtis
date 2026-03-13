import Link from "next/link";

import { LikeButton } from "@/components/engagement/like-button";
import { formatRelativeRelease } from "@/lib/utils";
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
      </Link>
      <div className="px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {formatRelativeRelease(film.publishedAt)}
          </p>
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {film.commentCount} comment{film.commentCount === 1 ? "" : "s"}
          </p>
        </div>
        <Link href={`/film/${film.slug}`} className="mt-3 block">
          <h3 className="title-md text-foreground">{film.title}</h3>
        </Link>
        <Link
          href={`/creator/${film.creator.handle}`}
          className="mt-2 inline-block text-sm text-foreground/88 underline decoration-white/15 underline-offset-4 transition hover:text-foreground"
        >
          {film.creator.displayName || `@${film.creator.handle}`}
        </Link>
        <Link href={`/film/${film.slug}`} className="block">
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
            {film.synopsis || "Release note to follow."}
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            View release page
          </p>
        </Link>
      </div>
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
