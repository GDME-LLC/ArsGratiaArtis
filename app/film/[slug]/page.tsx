import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentForm } from "@/components/comments/comment-form";
import { CommentList } from "@/components/comments/comment-list";
import { FollowButton } from "@/components/engagement/follow-button";
import { LikeButton } from "@/components/engagement/like-button";
import { FilmArtwork } from "@/components/films/film-artwork";
import { CreatorBadgeList } from "@/components/badges/creator-badge-list";
import { ShareActions } from "@/components/shared/share-actions";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { findResourceEntryByToolSlug } from "@/lib/resources/tool-links";
import { getFilmArtworkUrl } from "@/lib/films/artwork";
import { getModerationStatusDescription, getModerationStatusLabel } from "@/lib/films/moderation";
import { getMuxPlaybackUrl } from "@/lib/films/playback";
import { listFilmComments } from "@/lib/services/comments";
import { getPublicFilmBySlug } from "@/lib/services/films";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";
import { formatCommentCount, formatReleaseDate, resolveCreatorName } from "@/lib/utils";

type FilmPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function FilmPage({ params }: FilmPageProps) {
  const { slug } = await params;

  if (!hasSupabaseServerEnv()) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Film pages need a live database connection"
          description="Local shell mode keeps the interface visible, but public releases only resolve once published films can be loaded."
        />
      </section>
    );
  }

  const data = await getPublicFilmBySlug(slug);
  const comments = data ? await listFilmComments(data.id) : [];
  const user = await getUser();

  if (!data) {
    notFound();
  }

  const playbackUrl = data.muxPlaybackId ? getMuxPlaybackUrl(data.muxPlaybackId) : null;
  const artworkUrl = getFilmArtworkUrl({ posterUrl: data.posterUrl, muxPlaybackId: data.muxPlaybackId });
  const releaseDate = formatReleaseDate(data.publishedAt);
  const creatorName = resolveCreatorName({ handle: data.creator.handle, displayName: data.creator.displayName });
  const showFollowAccessPrompt = !data.creator.isCurrentUser && !data.creator.viewerCanFollow;
  const followAccessHref = user ? "/settings#profile" : "/signup";
  const hasTools = data.creation.tools.length > 0;
  const hasProcessNotes = Boolean(data.creation.processNotes);
  const hasProcessSummary = Boolean(data.creation.processSummary);
  const hasPromptText = Boolean(data.creation.promptText);
  const hasProcessTags = data.creation.processTags.length > 0;
  const hasAnyProcessMaterial = hasTools || hasProcessSummary || hasProcessNotes || hasPromptText || hasProcessTags;
  const promptVisibilityLabel =
    data.creation.promptVisibility === "public"
      ? "Visible on this release page"
      : data.creation.promptVisibility === "followers"
        ? "Visible to approved viewers"
        : "Kept private by the creator";
  const processSummary = !hasAnyProcessMaterial
    ? "No process materials were shared for this release."
    : data.creation.promptVisibility === "followers" && !hasPromptText && !hasProcessNotes && !hasTools
      ? "Process materials are available only to approved viewers."
      : "Selected process materials accompany this release.";
  const seriesMeta =
    data.series && (data.series.seasonNumber || data.series.episodeNumber)
      ? `${data.series.seasonNumber ? `Season ${data.series.seasonNumber}` : "Series"}${data.series.episodeNumber ? ` / Episode ${data.series.episodeNumber}` : ""}`
      : null;
  const moderationLabel = getModerationStatusLabel(data.moderationStatus);
  const moderationDescription = getModerationStatusDescription(data.moderationStatus, data.moderationReason);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://arsgratia.com").replace(/\/$/, "");
  const filmUrl = `${siteUrl}/film/${data.slug}`;

  return (
    <section className="container-shell py-12 sm:py-16" data-reveal="page">
      <div className="surface-panel cinema-frame overflow-hidden" data-reveal="film-frame">
        {data.isOwner && data.moderationStatus !== "active" ? (
          <div className="border-b border-white/18 bg-white/8 px-6 py-4 text-sm text-foreground/88 sm:px-10">
            <p className="display-kicker text-foreground/80">{moderationLabel}</p>
            <p className="mt-2">{moderationDescription}</p>
          </div>
        ) : null}
        {playbackUrl ? (
          <video className="aspect-video w-full bg-black" controls playsInline preload="metadata" poster={artworkUrl ?? undefined} src={playbackUrl} />
        ) : (
          <div className="p-6 sm:p-8">
            <div className="mx-auto w-full max-w-[280px]">
              <FilmArtwork artworkUrl={artworkUrl} title={data.title} label="Release artwork" />
            </div>
          </div>
        )}
        <div className="px-5 py-6 sm:px-10 sm:py-8">
          <p className="display-kicker">Film</p>
          <h1 className="headline-xl mt-4">{data.title}</h1>
          <p className="body-lg mt-4 max-w-3xl">{data.synopsis || "A release note will appear here when the creator publishes one."}</p>
          <div className="mt-5 grid gap-5 border-t border-white/10 pt-5 sm:mt-6 sm:gap-6 sm:pt-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
            <div className="max-w-3xl">
              <p className="display-kicker">Description</p>
              <p className="body-sm mt-3">{data.description || "No extended note has been published for this release yet."}</p>
            </div>

            <aside className="min-w-0 rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5">
              <p className="display-kicker">About this release</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px] sm:tracking-[0.22em]">Released on ArsNeos</p>
                  <p className="mt-2 text-sm text-foreground">{releaseDate || "Publication date to follow."}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px] sm:tracking-[0.22em]">Filmmaker</p>
                  <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                    {data.creator.handle ? (
                      <Link href={`/creator/${data.creator.handle}`} className="inline-block min-w-0 break-words text-sm text-foreground underline decoration-white/20 underline-offset-4">
                        {creatorName}
                      </Link>
                    ) : (
                      <span className="inline-block text-sm text-foreground">{creatorName}</span>
                    )}
                    <CreatorBadgeList badges={data.creator.badges} />
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {data.creator.viewerCanFollow ? (
                      <FollowButton
                        creatorId={data.creator.id}
                        initialFollowerCount={data.creator.followerCount}
                        initialFollowing={data.creator.viewerIsFollowing}
                        isCurrentUser={data.creator.isCurrentUser}
                      />
                    ) : null}
                    {showFollowAccessPrompt ? (
                      <Button asChild variant="ghost" className="w-full sm:w-auto">
                        <Link href={followAccessHref}>Enable creator profile to follow</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
                {data.series ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px] sm:tracking-[0.22em]">Series</p>
                    <Link href={`/series/${data.series.slug}`} className="mt-2 inline-block break-words text-sm text-foreground underline decoration-white/20 underline-offset-4">
                      {data.series.title}
                    </Link>
                    {seriesMeta ? <p className="mt-2 text-sm text-muted-foreground">{seriesMeta}</p> : null}
                  </div>
                ) : null}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px] sm:tracking-[0.22em]">Tools Used</p>
                  {hasTools ? (
                    <div className="mt-3 flex min-w-0 flex-wrap gap-2">
                      {data.creation.tools.map((tool) => {
                        const resourceEntry = findResourceEntryByToolSlug(tool.slug);
                        const href = resourceEntry ? `/resources#resource-entry-${tool.slug}` : tool.websiteUrl;
                        const content = (
                          <span className="max-w-full rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-foreground sm:text-xs sm:tracking-[0.16em]">
                            {tool.name}
                          </span>
                        );

                        return href ? (
                          <Link key={tool.id} href={href} className="transition hover:opacity-90">
                            {content}
                          </Link>
                        ) : (
                          <span key={tool.id}>{content}</span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">{processSummary}</p>
                  )}
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-6 min-w-0">
            <LikeButton filmId={data.id} initialLikeCount={data.engagement.likeCount} initialLiked={data.engagement.viewerHasLiked} />
            <p className="mt-3 text-sm text-muted-foreground">{formatCommentCount(data.engagement.commentCount)}</p>
            <Link href={`/report?type=film&slug=${data.slug}`} className="mt-3 inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4">
              Report this film
            </Link>
            <ShareActions url={filmUrl} title={`${data.title} by ${creatorName} | ArsNeos`} className="mt-6" />
          </div>

          {hasAnyProcessMaterial ? (
            <div className="mt-7 border-t border-white/10 pt-5 sm:mt-8 sm:pt-6">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <article className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5" data-reveal="panel">
                  <p className="display-kicker">Process</p>
                  <p className="mt-4 text-sm text-muted-foreground">{processSummary}</p>
                  <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px] sm:tracking-[0.22em]">Prompt visibility</p>
                    <p className="mt-2 text-sm text-foreground">{promptVisibilityLabel}</p>
                  </div>
                  {data.creation.processSummary ? (
                    <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px] sm:tracking-[0.22em]">Workflow / Process</p>
                      <p className="mt-2 body-sm">{data.creation.processSummary}</p>
                    </div>
                  ) : null}
                  {hasProcessTags ? (
                    <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px] sm:tracking-[0.22em]">Made With</p>
                      <div className="mt-3 flex min-w-0 flex-wrap gap-2">
                        {data.creation.processTags.map((tag) => (
                          <span key={tag} className="max-w-full rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-foreground sm:text-xs sm:tracking-[0.16em]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {hasPromptText ? (
                    <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px] sm:tracking-[0.22em]">Prompt</p>
                      <p className="mt-2 body-sm">{data.creation.promptText}</p>
                    </div>
                  ) : null}
                </article>

                <article className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5" data-reveal="panel">
                  <p className="display-kicker">Production Notes</p>
                  <p className="body-sm mt-4">{data.creation.processNotes || "No process notes were shared for this release."}</p>
                  {hasTools ? (
                    <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px] sm:tracking-[0.22em]">Tools Used</p>
                      <div className="mt-3 flex min-w-0 flex-wrap gap-2">
                        {data.creation.tools.map((tool) => {
                          const resourceEntry = findResourceEntryByToolSlug(tool.slug);
                          const href = resourceEntry ? `/resources#resource-entry-${tool.slug}` : tool.websiteUrl;
                          const content = (
                            <span className="max-w-full rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-foreground sm:text-xs sm:tracking-[0.16em]">
                              {tool.name}
                            </span>
                          );

                          return href ? (
                            <Link key={tool.id} href={href} className="transition hover:opacity-90">
                              {content}
                            </Link>
                          ) : (
                            <span key={tool.id}>{content}</span>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  {data.series?.nextEpisode ? (
                    <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px] sm:tracking-[0.22em]">Series continuity</p>
                      <Link href={`/film/${data.series.nextEpisode.slug}`} className="mt-2 inline-block break-words text-sm text-foreground underline decoration-white/20 underline-offset-4">
                        Next episode: {data.series.nextEpisode.title}
                      </Link>
                    </div>
                  ) : null}
                </article>
              </div>
            </div>
          ) : null}

          <div className="mt-7 border-t border-white/10 pt-5 sm:mt-8 sm:pt-6">
            <p className="display-kicker">Comments</p>
            <div className="mt-4 grid gap-4 sm:gap-5">
              <CommentForm filmId={data.id} signedIn={Boolean(user)} />
              <CommentList comments={comments} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

