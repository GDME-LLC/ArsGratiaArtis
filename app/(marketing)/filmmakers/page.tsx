import Link from "next/link";

import { CreatorBadgeList } from "@/components/badges/creator-badge-list";
import { HorizontalRail } from "@/components/shared/horizontal-rail";
import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { StatePanel } from "@/components/shared/state-panel";
import { listPublicCreators } from "@/lib/profiles";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";
import { formatCountLabel, formatFollowerCount, formatRelativeRelease } from "@/lib/utils";

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
            description="As creators begin publishing work, this roster will fill with filmmaker pages, released films, and connected series. Until then, browse the current front page selections."
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
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <h2 className="headline-lg min-w-0 break-words text-foreground">{creator.displayName}</h2>
                      <CreatorBadgeList badges={creator.badges} />
                    </div>
                    <p className="mt-2 break-all text-sm text-muted-foreground">@{creator.handle}</p>
                    <p className="body-sm mt-4 line-clamp-3 max-w-2xl">
                      {creator.bio || "A public filmmaker page is live. More context will arrive as releases, notes, and series take shape."}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-muted-foreground md:min-w-[210px]">
                    <p className="display-kicker">Presence</p>
                    <p className="mt-2 break-words text-lg font-semibold text-foreground sm:text-xl">{formatFollowerCount(creator.followerCount)}</p>
                    <Link
                      href={`/creator/${creator.handle}`}
                      className="mt-4 inline-block text-sm text-foreground underline decoration-white/20 underline-offset-4"
                    >
                      View filmmaker
                    </Link>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
                  <div className="min-w-0 rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-primary/82 sm:text-[11px] sm:tracking-[0.24em]">Released Films</p>
                    <p className="mt-2 break-words text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">{formatCountLabel(creator.publicFilmCount, "release")}</p>
                  </div>
                  <div className="min-w-0 rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-primary/82 sm:text-[11px] sm:tracking-[0.24em]">Series</p>
                    <p className="mt-2 break-words text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">{formatCountLabel(creator.seriesCount, "series", "series")}</p>
                  </div>
                  <div className="min-w-0 rounded-[20px] border border-white/10 bg-white/5 p-4 min-[420px]:col-span-2 lg:col-span-1">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-primary/82 sm:text-[11px] sm:tracking-[0.24em]">Latest Release</p>
                    <p className="mt-2 line-clamp-2 break-words text-sm font-medium text-foreground sm:text-[0.95rem]">
                      {latestRelease?.title ?? "No public releases yet."}
                    </p>
                    {latestRelease?.publishedAt ? (
                      <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-xs sm:tracking-[0.2em]">
                        {formatRelativeRelease(latestRelease.publishedAt)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                    <p className="display-kicker">Latest Release</p>
                    <Link
                      href={`/creator/${creator.handle}`}
                      className="text-sm text-foreground underline decoration-white/20 underline-offset-4"
                    >
                      View filmmaker
                    </Link>
                  </div>

                  {creator.featuredReleases.length > 0 ? (
                    <div className="mt-4">
                      <HorizontalRail ariaLabel={`${creator.displayName} releases`}>
                        {creator.featuredReleases.map((release) => (
                          <article
                            key={release.id}
                            className="w-[min(82vw,17rem)] shrink-0 snap-start rounded-[20px] border border-white/10 bg-black/20 p-4 sm:w-[16rem]"
                          >
                            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px] sm:tracking-[0.22em]">
                              {formatRelativeRelease(release.publishedAt)}
                            </p>
                            <h3 className="title-md mt-3 break-words text-foreground">{release.title}</h3>
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
                      </HorizontalRail>
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

