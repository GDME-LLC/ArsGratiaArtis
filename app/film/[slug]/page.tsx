import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentForm } from "@/components/comments/comment-form";
import { FoundingCreatorBadge } from "@/components/founding/founding-creator-badge";
import { CommentList } from "@/components/comments/comment-list";
import { LikeButton } from "@/components/engagement/like-button";
import { FilmArtwork } from "@/components/films/film-artwork";
import { StatePanel } from "@/components/shared/state-panel";
import { getFilmArtworkUrl } from "@/lib/films/artwork";
import { getModerationStatusDescription, getModerationStatusLabel } from "@/lib/films/moderation";
import { getMuxPlaybackUrl } from "@/lib/films/playback";
import { listFilmComments } from "@/lib/services/comments";
import { getPublicFilmBySlug } from "@/lib/services/films";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";
import { formatCommentCount, formatReleaseDate } from "@/lib/utils";

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
  const artworkUrl = getFilmArtworkUrl({
    posterUrl: data.posterUrl,
    muxPlaybackId: data.muxPlaybackId,
  });
  const releaseDate = formatReleaseDate(data.publishedAt);
  const hasTools = data.creation.tools.length > 0;
  const hasWorkflowNotes = Boolean(data.creation.workflowNotes);
  const hasPromptText = Boolean(data.creation.promptText);
  const hasAnyProcessMaterial = hasTools || hasWorkflowNotes || hasPromptText;
  const promptVisibilityLabel =
    data.creation.promptVisibility === "public"
      ? "Visible on this release page"
      : data.creation.promptVisibility === "followers"
        ? "Visible to approved viewers"
        : "Kept private by the creator";
  const processSummary = !hasAnyProcessMaterial
    ? "No process materials were shared for this release."
    : data.creation.promptVisibility === "followers" && !hasPromptText && !hasWorkflowNotes && !hasTools
      ? "Process materials are available only to approved viewers."
      : "Selected process materials accompany this release.";
  const seriesMeta =
    data.series && (data.series.seasonNumber || data.series.episodeNumber)
      ? `${data.series.seasonNumber ? `Season ${data.series.seasonNumber}` : "Series"}${data.series.episodeNumber ? ` / Episode ${data.series.episodeNumber}` : ""}`
      : null;
  const moderationLabel = getModerationStatusLabel(data.moderationStatus);
  const moderationDescription = getModerationStatusDescription(data.moderationStatus, data.moderationReason);

  return (
    <section className="container-shell py-16">
      <div className="surface-panel cinema-frame overflow-hidden">
        {data.isOwner && data.moderationStatus !== "active" ? (
          <div className="border-b border-amber-500/25 bg-amber-500/10 px-6 py-4 text-sm text-amber-100 sm:px-10">
            <p className="display-kicker text-amber-100/90">{moderationLabel}</p>
            <p className="mt-2">{moderationDescription}</p>
          </div>
        ) : null}
        {playbackUrl ? (
          <video
            className="aspect-video w-full bg-black"
            controls
            playsInline
            preload="metadata"
            poster={artworkUrl ?? undefined}
            src={playbackUrl}
          />
        ) : (
          <div className="p-6 sm:p-8">
            <div className="mx-auto w-full max-w-[280px]">
              <FilmArtwork artworkUrl={artworkUrl} title={data.title} label="Release artwork" />
            </div>
          </div>
        )}
        <div className="px-6 py-8 sm:px-10">
          <p className="display-kicker">Film</p>
          <h1 className="headline-xl mt-4">{data.title}</h1>
          <p className="body-lg mt-4 max-w-3xl">
            {data.synopsis || "A release note will appear here when the creator publishes one."}
          </p>
          <div className="mt-6 grid gap-6 border-t border-white/10 pt-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
            <div className="max-w-3xl">
              <p className="display-kicker">Description</p>
              <p className="body-sm mt-3">
                {data.description || "No extended note has been published for this release yet."}
              </p>
            </div>

            <aside className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="display-kicker">About this release</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Released on ArsGratia
                  </p>
                  <p className="mt-2 text-sm text-foreground">{releaseDate || "Publication date to follow."}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Creator</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/creator/${data.creator.handle}`}
                      className="inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
                    >
                      {data.creator.displayName || `@${data.creator.handle}`}
                    </Link>
                    <FoundingCreatorBadge founder={data.creator.foundingCreator} showNumber />
                  </div>
                </div>
                {data.series ? (
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Series</p>
                    <Link
                      href={`/series/${data.series.slug}`}
                      className="mt-2 inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
                    >
                      {data.series.title}
                    </Link>
                    {seriesMeta ? (
                      <p className="mt-2 text-sm text-muted-foreground">{seriesMeta}</p>
                    ) : null}
                  </div>
                ) : null}
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Tools behind the work</p>
                  {hasTools ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {data.creation.tools.map((tool) => (
                        <span
                          key={tool.id}
                          className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs uppercase tracking-[0.16em] text-foreground"
                        >
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">{processSummary}</p>
                  )}
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-6">
            <LikeButton
              filmId={data.id}
              initialLikeCount={data.engagement.likeCount}
              initialLiked={data.engagement.viewerHasLiked}
            />
            <p className="mt-3 text-sm text-muted-foreground">
              {formatCommentCount(data.engagement.commentCount)}
            </p>
            <Link
              href={`/report?type=film&slug=${data.slug}`}
              className="mt-3 inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
            >
              Report this film
            </Link>
          </div>

          {hasAnyProcessMaterial ? (
            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="display-kicker">Tools behind the work</p>
                  <p className="mt-4 text-sm text-muted-foreground">{processSummary}</p>
                  <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Prompt visibility</p>
                    <p className="mt-2 text-sm text-foreground">{promptVisibilityLabel}</p>
                  </div>
                  {hasPromptText ? (
                    <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Prompt</p>
                      <p className="mt-2 body-sm">{data.creation.promptText}</p>
                    </div>
                  ) : null}
                  {hasTools ? (
                    <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Listed tools</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {data.creation.tools.map((tool) => (
                          <span
                            key={tool.id}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-foreground"
                          >
                            {tool.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>

                <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="display-kicker">Workflow notes</p>
                  <p className="body-sm mt-4">
                    {data.creation.workflowNotes || "No workflow notes were shared for this release."}
                  </p>
                  {data.series?.nextEpisode ? (
                    <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Series continuity</p>
                      <Link
                        href={`/film/${data.series.nextEpisode.slug}`}
                        className="mt-2 inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
                      >
                        Next episode: {data.series.nextEpisode.title}
                      </Link>
                    </div>
                  ) : null}
                </article>
              </div>
            </div>
          ) : null}

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="display-kicker">Comments</p>
            <div className="mt-4 grid gap-5">
              <CommentForm filmId={data.id} signedIn={Boolean(user)} />
              <CommentList comments={comments} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


