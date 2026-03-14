import Link from "next/link";

import { FilmArtwork } from "@/components/films/film-artwork";
import { LikeButton } from "@/components/engagement/like-button";
import { getFilmArtworkUrl, getMuxAnimatedPreviewUrl } from "@/lib/films/artwork";
import { getFilmCategoryLabel } from "@/lib/films/categories";
import { formatRelativeRelease } from "@/lib/utils";
import type { PublicFilmCard } from "@/types";

type PublicFilmCardProps = {
  film: PublicFilmCard;
};

export function PublicFilmCard({ film }: PublicFilmCardProps) {
  const artworkUrl = getFilmArtworkUrl({
    posterUrl: film.posterUrl,
    muxPlaybackId: film.muxPlaybackId,
  });
  const previewUrl = film.muxPlaybackId ? getMuxAnimatedPreviewUrl(film.muxPlaybackId) : null;
  const releaseYear = film.publishedAt ? new Date(film.publishedAt).getFullYear() : null;

  return (
    <article className="surface-panel cinema-frame flex h-full flex-col overflow-hidden">
      <Link href={`/film/${film.slug}`} className="block">
        <div className="p-4 pb-0 sm:p-5 sm:pb-0">
          <FilmArtwork artworkUrl={artworkUrl} previewUrl={previewUrl} title={film.title} />
        </div>
      </Link>
      <div className="flex flex-1 flex-col px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {formatRelativeRelease(film.publishedAt)}
          </p>
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {film.commentCount} comment{film.commentCount === 1 ? "" : "s"}
          </p>
        </div>
        <Link href={`/film/${film.slug}`} className="mt-3 block">
          <div className="flex flex-wrap gap-2">
            {film.staffPick ? (
              <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-primary">
                Staff Pick
              </p>
            ) : null}
            <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground/88">
              {getFilmCategoryLabel(film.category)}
            </p>
          </div>
          <h3 className="title-md mt-3 text-foreground">{film.title}</h3>
        </Link>
        <Link
          href={`/creator/${film.creator.handle}`}
          className="mt-2 inline-block text-sm text-foreground/88 underline decoration-white/15 underline-offset-4 transition hover:text-foreground"
        >
          {film.creator.displayName || `@${film.creator.handle}`}
        </Link>
        {releaseYear ? <p className="mt-2 text-sm text-muted-foreground">{releaseYear}</p> : null}
        <Link href={`/film/${film.slug}`} className="block flex-1">
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
            {film.synopsis || "Release note to follow."}
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            View release page
          </p>
        </Link>
        <div className="mt-4">
          <LikeButton
            filmId={film.id}
            initialLikeCount={film.likeCount}
            initialLiked={film.viewerHasLiked}
          />
        </div>
      </div>
    </article>
  );
}
