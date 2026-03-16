import Link from "next/link";

import { Heart, MessageCircle } from "lucide-react";

import { FilmArtwork } from "@/components/films/film-artwork";
import { FoundingCreatorBadge } from "@/components/founding/founding-creator-badge";
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
    <article className="surface-panel cinema-frame flex h-full flex-col overflow-hidden">
      <Link href={`/film/${film.slug}`} className="block">
        <div className="p-4 pb-0 sm:p-5 sm:pb-0">
          <FilmArtwork artworkUrl={artworkUrl} previewUrl={previewUrl} title={film.title} />
        </div>
      </Link>
      <div className="flex flex-1 flex-col px-4 py-4 sm:px-5">
        <Link href={`/film/${film.slug}`} className="block">
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

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">by</span>
          {creatorHref ? (
            <Link
              href={creatorHref}
              className="inline-block text-sm text-muted-foreground transition hover:text-foreground"
            >
              {creatorName}
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">{creatorName}</span>
          )}
          <FoundingCreatorBadge founder={film.creator.foundingCreator} className="px-2.5 py-1 text-[10px]" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="uppercase tracking-[0.18em]">{publishedLabel}</span>
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
          <p className="mt-4 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            View release page
          </p>
        </Link>
      </div>
    </article>
  );
}
