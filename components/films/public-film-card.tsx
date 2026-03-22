import Link from "next/link";

import { Heart, MessageCircle } from "lucide-react";

import { FilmArtwork } from "@/components/films/film-artwork";
import { CreatorBadgeList } from "@/components/badges/creator-badge-list";
import { getFilmArtworkUrl, getMuxAnimatedPreviewUrl } from "@/lib/films/artwork";
import { getFilmCategoryLabel } from "@/lib/films/categories";
import {
  formatCountValue,
  formatRelativeRelease,
  hasCreatorIdentity,
  resolveCreatorName,
} from "@/lib/utils";
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
  const creatorName = resolveCreatorName({
    handle: film.creator.handle,
    displayName: film.creator.displayName,
  });
  const creatorHref = film.creator.handle ? `/creator/${film.creator.handle}` : null;
  const publishedLabel = formatRelativeRelease(film.publishedAt, "");
  const synopsis =
    film.synopsis ||
    (hasCreatorIdentity({ handle: film.creator.handle, displayName: film.creator.displayName })
      ? "Release note to follow."
      : "Independent Filmmaker");

  return (
    <article className="surface-panel cinema-frame flex h-full min-w-0 flex-col overflow-hidden">
      <Link href={`/film/${film.slug}`} className="block">
        <div className="p-4 pb-0 sm:p-5 sm:pb-0">
          <FilmArtwork artworkUrl={artworkUrl} previewUrl={previewUrl} title={film.title} />
        </div>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col px-4 py-4 sm:px-5">
        <Link href={`/film/${film.slug}`} className="block">
          <div className="flex min-w-0 flex-wrap gap-2">
            {film.staffPick ? (
              <p className="inline-flex max-w-full rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-primary sm:text-[11px] sm:tracking-[0.18em]">
                Staff Pick
              </p>
            ) : null}
            <p className="inline-flex max-w-full rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-foreground/88 sm:text-[11px] sm:tracking-[0.18em]">
              {getFilmCategoryLabel(film.category)}
            </p>
          </div>
          <h3 className="title-md mt-3 break-words text-foreground">{film.title}</h3>
        </Link>

        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80 sm:text-xs sm:tracking-[0.16em]">by</span>
          {creatorHref ? (
            <Link
              href={creatorHref}
              className="inline-block min-w-0 break-words text-sm text-muted-foreground transition hover:text-foreground"
            >
              {creatorName}
            </Link>
          ) : (
            <span className="min-w-0 break-words text-sm text-muted-foreground">{creatorName}</span>
          )}
          <CreatorBadgeList badges={film.creator.badges} itemClassName="px-2.5 py-1 text-[10px]" />
        </div>

        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <span className="break-words uppercase tracking-[0.12em] sm:tracking-[0.18em]">{publishedLabel}</span>
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5" />
            {formatCountValue(film.likeCount)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />
            {formatCountValue(film.commentCount)}
          </span>
        </div>

        <Link href={`/film/${film.slug}`} className="block flex-1">
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
            {synopsis}
          </p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px] sm:tracking-[0.24em]">
            View release page
          </p>
        </Link>
      </div>
    </article>
  );
}

