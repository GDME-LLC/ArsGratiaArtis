import Link from "next/link";
import { notFound } from "next/navigation";

import { StatePanel } from "@/components/shared/state-panel";
import { getPublicFilmBySlug } from "@/lib/services/films";
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
          title="Public film pages need Supabase"
          description="Local fallback mode keeps the shell running, but public film pages need the database connection to resolve published films."
        />
      </section>
    );
  }

  const data = await getPublicFilmBySlug(slug);

  if (!data) {
    notFound();
  }

  return (
    <section className="container-shell py-16">
      <div className="surface-panel cinema-frame overflow-hidden">
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
        <div className="px-6 py-8 sm:px-10">
          <p className="display-kicker">Film</p>
          <h1 className="headline-xl mt-4">{data.title}</h1>
          <p className="body-lg mt-4 max-w-3xl">
            {data.synopsis || "Synopsis coming soon."}
          </p>

          <div className="mt-8 flex flex-col gap-6 border-t border-white/10 pt-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="display-kicker">Description</p>
              <p className="body-sm mt-3">
                {data.description || "No long description has been published yet."}
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
        </div>
      </div>
    </section>
  );
}
