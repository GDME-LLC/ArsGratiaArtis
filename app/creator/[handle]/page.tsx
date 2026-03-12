import Link from "next/link";
import { notFound } from "next/navigation";

import { StatePanel } from "@/components/shared/state-panel";
import { getPublicProfileByHandle } from "@/lib/profiles";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

type CreatorPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { handle } = await params;

  if (!hasSupabaseServerEnv()) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Public profiles need Supabase"
          description="Local fallback mode keeps the app shell running, but creator pages need the database connection to resolve handles."
        />
      </section>
    );
  }

  const data = await getPublicProfileByHandle(handle);

  if (!data) {
    notFound();
  }

  const { profile, films } = data;

  return (
    <section className="container-shell py-16">
      <div className="surface-panel cinema-frame overflow-hidden">
        <div
          className="h-44 w-full bg-cover bg-center"
          style={
            profile.bannerUrl
              ? { backgroundImage: `linear-gradient(rgba(4,4,6,0.2), rgba(4,4,6,0.75)), url(${profile.bannerUrl})` }
              : undefined
          }
        />
        <div className="px-6 py-8 sm:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl font-semibold text-foreground"
                style={
                  profile.avatarUrl ? { backgroundImage: `url(${profile.avatarUrl})`, backgroundSize: "cover" } : undefined
                }
              >
                {!profile.avatarUrl ? profile.displayName.charAt(0).toUpperCase() : null}
              </div>
              <div>
                <p className="display-kicker">@{profile.handle}</p>
                <h1 className="headline-lg mt-2">{profile.displayName}</h1>
                <p className="body-sm mt-2 max-w-2xl">
                  {profile.bio || "This creator has not written a bio yet."}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Creator status:{" "}
                <span className="text-foreground">
                  {profile.isCreator ? "Creator" : "Viewer"}
                </span>
              </p>
              {profile.websiteUrl ? (
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline decoration-white/20 underline-offset-4"
                >
                  Visit website
                </a>
              ) : null}
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="display-kicker">Published Films</p>
                <h2 className="title-md mt-2 text-foreground">
                  {films.length === 0 ? "No public films yet" : `${films.length} public film${films.length === 1 ? "" : "s"}`}
                </h2>
              </div>
            </div>

            {films.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 px-6 py-8 text-sm text-muted-foreground">
                This creator page is live, but there are no published films to show yet.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {films.map((film) => (
                  <article key={film.id} className="rounded-[24px] border border-white/10 bg-white/5 p-6">
                    <p className="display-kicker">{film.publishedAt ? "Published" : "Film"}</p>
                    <h3 className="title-md mt-3 text-foreground">{film.title}</h3>
                    <p className="body-sm mt-3">{film.synopsis || "Synopsis coming soon."}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      slug / {film.slug}
                    </p>
                    <Link
                      href={`/film/${film.slug}`}
                      className="mt-4 inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
                    >
                      View film
                    </Link>
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
