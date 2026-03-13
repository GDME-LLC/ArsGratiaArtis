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
  const episodeLabel = data.series?.episodeNumber
    ? `Episode ${data.series.episodeNumber}`
    : data.series
      ? "Episode"
      : null;

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

          {data.series ? (
            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="display-kicker">Series</p>
              <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <Link
                    href={`/series/${data.series.slug}`}
                    className="title-md text-foreground underline decoration-white/20 underline-offset-4"
                  >
                    {data.series.title}
                  </Link>
                  {episodeLabel ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {data.series.seasonNumber ? `Season ${data.series.seasonNumber} / ` : ""}
                      {episodeLabel}
                    </p>
                  ) : null}
                </div>

                {data.series.nextEpisode ? (
                  <Link
                    href={`/film/${data.series.nextEpisode.slug}`}
                    className="inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
                  >
                    Next episode: {data.series.nextEpisode.title}
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-6 border-t border-white/10 pt-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="display-kicker">Description</p>
              <p className="body-sm mt-3">
                {data.description || "No extended note has been published for this release yet."}
              </p>
            </div>

            <div className="min-w-[220px] rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="display-kicker">Creator</p>
              <p className="title-md mt-3 text-foreground">{data.creator.displayName}</p>
              <Link
                href={`/creator/${data.creator.handle}`}
                className="mt-3 inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
              >
                Visit creator page
              </Link>
            </div>
          </div>

          {hasCreationPanel ? (
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="display-kicker">Creation</p>
              <div className="mt-4 grid gap-5 lg:grid-cols-3">
                <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="display-kicker">Tools Used</p>
                  {data.creation.tools.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
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
                    <p className="body-sm mt-4 text-muted-foreground">
                      No tools were shared for this release.
                    </p>
                  )}
                </article>

                <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="display-kicker">Prompt</p>
                  <p className="body-sm mt-4">
                    {data.creation.promptText ||
                      (data.creation.promptVisibility === "private"
                        ? "The creator kept the prompt private."
                        : "The prompt is only available to approved viewers.")}
                  </p>
                </article>

                <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="display-kicker">Workflow Notes</p>
                  <p className="body-sm mt-4">
                    {data.creation.workflowNotes || "No workflow notes were shared for this release."}
                  </p>
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
