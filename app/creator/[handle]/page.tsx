import Link from "next/link";
import { notFound } from "next/navigation";

import { FollowButton } from "@/components/engagement/follow-button";
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
          title="Creator pages need a live database connection"
          description="The shell can render locally, but public creator pages only resolve once profiles and films are available."
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
    <section className="container-shell py-14">
      <div className="surface-panel cinema-frame overflow-hidden">
        <div
          className="h-36 w-full bg-cover bg-center"
          style={
            profile.bannerUrl
              ? { backgroundImage: `linear-gradient(rgba(4,4,6,0.2), rgba(4,4,6,0.75)), url(${profile.bannerUrl})` }
              : undefined
          }
        />
        <div className="px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl font-semibold text-foreground"
                style={
                  profile.avatarUrl ? { backgroundImage: `url(${profile.avatarUrl})`, backgroundSize: "cover" } : undefined
                }
              >
                {!profile.avatarUrl ? profile.displayName.charAt(0).toUpperCase() : null}
              </div>
              <div>
                <p className="display-kicker">@{profile.handle}</p>
                <h1 className="headline-lg mt-1">{profile.displayName}</h1>
                <p className="body-sm mt-2 max-w-2xl">
                  {profile.bio || "This creator page is live. A fuller bio has not been published yet."}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-end">
                <FollowButton
                  creatorId={profile.id}
                  initialFollowerCount={profile.followerCount}
                  initialFollowing={profile.viewerIsFollowing}
                  isCurrentUser={profile.isCurrentUser}
                />
              </div>
              <p>
                Followers: <span className="text-foreground">{profile.followerCount}</span>
              </p>
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
              <Link
                href={`/report?type=creator&handle=${profile.handle}`}
                className="block text-foreground underline decoration-white/20 underline-offset-4"
              >
                Report profile
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="display-kicker">Published Films</p>
                <h2 className="title-md mt-2 text-foreground">
                  {films.length === 0 ? "No public releases yet" : `${films.length} public release${films.length === 1 ? "" : "s"}`}
                </h2>
              </div>
            </div>

            {films.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 px-6 py-8 text-sm text-muted-foreground">
                This creator page is ready, but no public releases have premiered here yet.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {films.map((film) => (
                  <article key={film.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <p className="display-kicker">{film.publishedAt ? "Published" : "Film"}</p>
                    <h3 className="title-md mt-2 text-foreground">{film.title}</h3>
                    <p className="body-sm mt-2">{film.synopsis || "Synopsis to follow."}</p>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                      {film.commentCount} comment{film.commentCount === 1 ? "" : "s"} / slug {film.slug}
                    </p>
                    <div className="mt-3">
                      <span className="text-sm text-muted-foreground">
                        {film.likeCount} like{film.likeCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <Link
                      href={`/film/${film.slug}`}
                      className="mt-4 inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
                    >
                      Open release page
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
