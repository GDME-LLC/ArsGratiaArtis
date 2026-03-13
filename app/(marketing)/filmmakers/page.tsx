import Link from "next/link";

import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { StatePanel } from "@/components/shared/state-panel";
import { listPublicCreators } from "@/lib/profiles";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";
import { formatRelativeRelease } from "@/lib/utils";

export default async function FilmmakersPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <SectionShell className="py-20">
        <StatePanel
          title="The filmmaker roster needs a live database connection"
          description="Local shell mode keeps the interface visible, but this browse surface only works once public creator pages and releases can be loaded."
        />
      </SectionShell>
    );
  }

  const creators = await listPublicCreators(12);

  return (
    <SectionShell className="py-14 sm:py-16">
      <PageIntro
        eyebrow="Meet the Filmmakers"
        title="Meet the Filmmakers"
        description="The people behind the films."
      />

      {creators.length === 0 ? (
        <div className="mt-8">
          <StatePanel
            title="No public filmmakers yet"
            description="As invited creators begin publishing work, this roster will fill with filmmaker pages, released films, and connected series."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {creators.map((creator) => {
            const latestRelease = creator.featuredReleases[0] ?? null;

            return (
              <article key={creator.id} className="surface-panel cinema-frame overflow-hidden p-5 sm:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="display-kicker">Filmmaker</p>
                    <h2 className="headline-lg mt-3 text-foreground">{creator.displayName}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">@{creator.handle}</p>
                    <p className="body-sm mt-4 line-clamp-3 max-w-2xl">
                      {creator.bio || "A public filmmaker page is live. More context will arrive as releases, notes, and series take shape."}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-muted-foreground md:min-w-[210px]">
                    <p className="display-kicker">Presence</p>
                    <p className="mt-2 text-foreground">
                      {creator.followerCount} follower{creator.followerCount === 1 ? "" : "s"}
                    </p>
                    <Link
                      href={`/creator/${creator.handle}`}
                      className="mt-4 inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
                    >
                      View filmmaker
                    </Link>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <p className="display-kicker">Released Films</p>
                    <p className="title-md mt-3 text-foreground">{creator.publicFilmCount}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <p className="display-kicker">Series</p>
                    <p className="title-md mt-3 text-foreground">{creator.seriesCount}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <p className="display-kicker">Followers</p>
                    <p className="title-md mt-3 text-foreground">{creator.followerCount}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <p className="display-kicker">Latest Release</p>
                    <p className="mt-3 line-clamp-2 text-sm text-foreground">
                      {latestRelease?.title ?? "No public releases yet."}
                    </p>
                    {latestRelease?.publishedAt ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {formatRelativeRelease(latestRelease.publishedAt)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="display-kicker">Latest Release</p>
                    <Link
                      href={`/creator/${creator.handle}`}
                      className="text-sm text-foreground underline decoration-white/20 underline-offset-4"
                    >
                      View filmmaker
                    </Link>
                  </div>

                  {creator.featuredReleases.length > 0 ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {creator.featuredReleases.map((release) => (
                        <article
                          key={release.id}
                          className="rounded-[20px] border border-white/10 bg-black/20 p-4"
                        >
                          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            {formatRelativeRelease(release.publishedAt)}
                          </p>
                          <h3 className="title-md mt-3 text-foreground">{release.title}</h3>
                          <p className="body-sm mt-3">
                            {release.synopsis || "Release notes and context will arrive with the film page."}
                          </p>
                          <Link
                            href={`/film/${release.slug}`}
                            className="mt-4 inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
                          >
                            View release
                          </Link>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">No public releases yet.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}
