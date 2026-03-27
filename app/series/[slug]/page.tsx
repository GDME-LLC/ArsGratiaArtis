import Link from "next/link";
import { notFound } from "next/navigation";

import { StatePanel } from "@/components/shared/state-panel";
import { getPublicSeriesBySlug } from "@/lib/services/films";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

type SeriesPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { slug } = await params;

  if (!hasSupabaseServerEnv()) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Public series pages need Supabase"
          description="Local fallback mode keeps the shell running, but series pages need the database connection to resolve published episodes."
        />
      </section>
    );
  }

  const data = await getPublicSeriesBySlug(slug);

  if (!data) {
    notFound();
  }

  return (
    <section className="container-shell py-16" data-reveal="page">
      <div className="surface-panel cinema-frame overflow-hidden" data-reveal="series-frame">
        <div
          className="h-64 w-full bg-cover bg-center"
          style={
            data.series.posterUrl
              ? {
                  backgroundImage: `linear-gradient(rgba(4,4,6,0.26), rgba(4,4,6,0.78)), url(${data.series.posterUrl})`,
                }
              : undefined
          }
        />
        <div className="px-6 py-8 sm:px-10">
          <p className="display-kicker">Series</p>
          <h1 className="headline-xl mt-4">{data.series.title}</h1>
          <p className="body-lg mt-4 max-w-3xl">
            {data.series.description || "Series description coming soon."}
          </p>

          <div className="mt-8 flex flex-col gap-6 border-t border-white/10 pt-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-[220px] rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="display-kicker">Creator</p>
              <p className="title-md mt-3 text-foreground">{data.series.creator.displayName}</p>
              <Link
                href={`/creator/${data.series.creator.handle}`}
                className="mt-3 inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
              >
                Visit creator page
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="display-kicker">Episodes</p>
            {data.episodes.length === 0 ? (
              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="body-sm text-muted-foreground">
                  No published public episodes are available for this series yet.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-4">
                {data.episodes.map((episode) => (
                  <article
                    key={episode.id}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-5" data-reveal="panel"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-3xl">
                        <p className="display-kicker">
                          {episode.seasonNumber ? `Season ${episode.seasonNumber}` : "Season"}{" "}
                          /{" "}
                          {episode.episodeNumber ? `Episode ${episode.episodeNumber}` : "Episode"}
                        </p>
                        <h2 className="title-md mt-3 text-foreground">{episode.title}</h2>
                        <p className="body-sm mt-3">
                          {episode.synopsis || "Synopsis coming soon."}
                        </p>
                      </div>

                      <Link
                        href={`/film/${episode.slug}`}
                        className="inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
                      >
                        Open episode
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

