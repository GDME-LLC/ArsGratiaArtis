import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentForm } from "@/components/comments/comment-form";
import { CommentList } from "@/components/comments/comment-list";
import { LikeButton } from "@/components/engagement/like-button";
import { StatePanel } from "@/components/shared/state-panel";
import { getMuxPlaybackUrl } from "@/lib/films/playback";
import { listFilmComments } from "@/lib/services/comments";
import { getPublicFilmBySlug } from "@/lib/services/films";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";
import { formatReleaseDate } from "@/lib/utils";

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
  const hasCreationPanel =
    data.creation.tools.length > 0 ||
    Boolean(data.creation.promptText) ||
    Boolean(data.creation.workflowNotes);
  const releaseDate = formatReleaseDate(data.publishedAt);
  const seriesMeta =
    data.series && (data.series.seasonNumber || data.series.episodeNumber)
      ? `${data.series.seasonNumber ? `Season ${data.series.seasonNumber}` : "Series"}${data.series.episodeNumber ? ` / Episode ${data.series.episodeNumber}` : ""}`
      : null;
  const promptVisibilityLabel =
    data.creation.promptVisibility === "public"
      ? "Prompt visible on this release page."
      : data.creation.promptVisibility === "followers"
        ? "Prompt visible to approved viewers."
        : "Prompt kept private by the creator.";

  return (
    <section className="container-shell py-16">
      <div className="surface-panel cinema-frame overflow-hidden">
        {playbackUrl ? (
          <video
            className="aspect-video w-full bg-black"
            controls
            playsInline
            preload="metadata"
            poster={data.posterUrl ?? undefined}
            src={playbackUrl}
          />
        ) : (
          <div
            className="h-64 w-full bg-cover bg-center"
            style={
              data.posterUrl
                ? {
                    backgroundImage: `linear-gradient(rgba(4,4,6,0.3), rgba(4,4,6,0.82)), url(${data.posterUrl})`,
                  }
                : undefined
            }
          />
        )}
        <div className="px-6 py-8 sm:px-10">
          <p className="display-kicker">Film</p>
          <h1 className="headline-xl mt-4">{data.title}</h1>
          <p className="body-lg mt-4 max-w-3xl">
            {data.synopsis || "Synopsis to follow."}
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
                  <Link
                    href={`/creator/${data.creator.handle}`}
                    className="mt-2 inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
                  >
                    {data.creator.displayName}
                  </Link>
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
                  {data.creation.tools.length > 0 ? (
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
                    <p className="mt-2 text-sm text-muted-foreground">No tools were listed for this release.</p>
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
              {data.engagement.commentCount} comment{data.engagement.commentCount === 1 ? "" : "s"}
            </p>
            <Link
              href={`/report?type=film&slug=${data.slug}`}
              className="mt-3 inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
            >
              Report this film
            </Link>
          </div>

          {hasCreationPanel ? (
            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="display-kicker">Tools behind the work</p>
                  <p className="mt-4 text-sm text-muted-foreground">{promptVisibilityLabel}</p>
                  <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Prompt visibility</p>
                    <p className="mt-2 text-sm text-foreground">
                      {data.creation.promptVisibility === "public"
                        ? "Public"
                        : data.creation.promptVisibility === "followers"
                          ? "Approved viewers"
                          : "Private"}
                    </p>
                  </div>
                  <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Prompt</p>
                    <p className="mt-2 body-sm">
                      {data.creation.promptText || promptVisibilityLabel}
                    </p>
                  </div>
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
