import Link from "next/link";
import { redirect } from "next/navigation";

import { CreatorBadgeList } from "@/components/badges/creator-badge-list";
import { FilmArtwork } from "@/components/films/film-artwork";
import { PublicFilmCard } from "@/components/films/public-film-card";
import { HorizontalRail } from "@/components/shared/horizontal-rail";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { hasAdminAccess } from "@/lib/admin";
import { getFilmArtworkUrl, getMuxAnimatedPreviewUrl } from "@/lib/films/artwork";
import { getFilmCategoryLabel } from "@/lib/films/categories";
import { ensureProfileForUser } from "@/lib/profiles";
import { getFollowerCount } from "@/lib/services/engagement";
import { listCreatorFilms } from "@/lib/services/films";
import { getUnreadNotificationCount, listNotificationsForUser } from "@/lib/services/notifications";
import { listCreatorWorkflowDrafts } from "@/lib/services/workflows";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";
import { formatMonthYear, formatRelativeRelease } from "@/lib/utils";

export default async function DashboardPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="The creator workspace needs live auth and database access"
          description="Local shell mode keeps the interface visible, but real profiles, drafts, and saved changes only work once Supabase is connected."
        />
      </section>
    );
  }

  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const profile = await ensureProfileForUser(user);

    if (!profile) {
      return (
        <section className="container-shell py-20">
          <StatePanel
            title="Profile unavailable"
            description="Your account is signed in, but the creator record could not be loaded right now."
          />
        </section>
      );
    }

    const [films, workflowDrafts, notifications, unreadNotificationCount, followerCount] = await Promise.all([
      listCreatorFilms(profile.id),
      listCreatorWorkflowDrafts(profile.id, 24),
      listNotificationsForUser(profile.id, 8),
      getUnreadNotificationCount(profile.id),
      getFollowerCount(profile.id),
    ]);
    const isAdmin = await hasAdminAccess(user);
    const founderSince = formatMonthYear(profile.foundingCreator.awardedAt ?? null);
    const projectDrafts = workflowDrafts.filter((draft) => draft.status !== "archived");
    const uploadDrafts = films.filter((film) => film.publishStatus === "draft");
    const publishedReleases = films.filter((film) => film.publishStatus === "published" && film.visibility === "public");
    const releaseCount = films.filter((film) => film.publishStatus === "published").length;
    const nextDraft = projectDrafts[0] ?? null;
    const publishedReleaseCards = publishedReleases.map((film) => ({
      id: film.id,
      title: film.title,
      slug: film.slug,
      synopsis: film.synopsis,
      category: film.category,
      posterUrl: film.posterUrl,
      muxPlaybackId: film.muxPlaybackId,
      likeCount: 0,
      commentCount: 0,
      viewerHasLiked: false,
      staffPick: false,
      createdAt: film.createdAt,
      publishedAt: film.updatedAt,
      creator: {
        handle: profile.handle,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        foundingCreator: profile.foundingCreator,
        badges: profile.badges,
      },
    }));

    return (
      <section className="container-shell py-10 sm:py-14">
        <div className="surface-panel cinema-frame p-6 sm:p-8">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="display-kicker">Creator Hub</p>
            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/5 text-lg font-semibold text-foreground"
                  style={
                    profile.avatarUrl
                      ? { backgroundImage: `url(${profile.avatarUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : undefined
                  }
                >
                  {!profile.avatarUrl ? (profile.displayName || profile.handle).charAt(0).toUpperCase() : null}
                </div>
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                    <h1 className="headline-xl min-w-0 break-words">{profile.displayName || profile.handle}</h1>
                    <CreatorBadgeList badges={profile.badges} />
                  </div>
                  <p className="mt-1 text-sm text-foreground/72">@{profile.handle}</p>
                  <p className="body-sm mt-3 max-w-3xl text-foreground/84">
                    {profile.bio || "Share your current focus, then build projects and releases from this hub."}
                  </p>
                  {profile.foundingCreator.isFoundingCreator ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-foreground/72">
                      Founding Creator{founderSince ? ` since ${founderSince}` : ""}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/workflows">Start Project</Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
                  <Link href="/upload">Upload Clip</Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
                  <Link href="/settings">Edit Profile</Link>
                </Button>
                {isAdmin ? (
                  <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
                    <Link href="/admin">Admin</Link>
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5 border-t border-white/10 pt-4 text-xs uppercase tracking-[0.14em] text-foreground/74 sm:mt-5">
              <span className="inline-flex rounded-full border border-white/14 bg-white/[0.04] px-3 py-1.5">{followerCount} followers</span>
              <span className="inline-flex rounded-full border border-white/14 bg-white/[0.04] px-3 py-1.5">{unreadNotificationCount} unread</span>
              <span className="inline-flex rounded-full border border-white/14 bg-white/[0.04] px-3 py-1.5">{profile.badges.length} badges</span>
              <span className="inline-flex rounded-full border border-white/14 bg-white/[0.04] px-3 py-1.5">{projectDrafts.length} active project{projectDrafts.length === 1 ? "" : "s"}</span>
              <span className="inline-flex rounded-full border border-white/14 bg-white/[0.04] px-3 py-1.5">{releaseCount} release{releaseCount === 1 ? "" : "s"}</span>
              {nextDraft ? (
                <Link href={`/workflows?draft=${nextDraft.id}`} className="inline-flex rounded-full border border-primary/28 bg-primary/10 px-3 py-1.5 text-primary transition hover:border-primary/40 hover:bg-primary/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/65 focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                  Continue draft
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="display-kicker">Projects</p>
                <h2 className="headline-lg mt-3">Current projects and saved progress</h2>
              </div>
              <Button asChild variant="ghost" size="lg">
                <Link href="/workflows">Open Project Builder</Link>
              </Button>
            </div>

            {projectDrafts.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
                <p className="display-kicker">Start here</p>
                <p className="title-md mt-3 text-foreground">No project drafts yet</p>
                <p className="body-sm mt-3">Start a project draft, add your first assets, and keep building from this hub.</p>
              </div>
            ) : (
              <div className="mt-6">
                <HorizontalRail ariaLabel="current projects">
                  {projectDrafts.map((draft) => (
                    <article
                      key={draft.id}
                      className="cinema-frame w-[min(84vw,18rem)] shrink-0 snap-start overflow-hidden rounded-none border border-white/30 bg-black p-4 shadow-[0_14px_34px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(116,124,136,0.3)] transition hover:border-white/40 hover:shadow-[0_18px_40px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.34),inset_0_-1px_0_rgba(116,124,136,0.34)] sm:w-[17rem]"
                    >
                      <p className="display-kicker">{draft.status === "seeded" ? "Active project" : "Draft project"}</p>
                      <h3 className="title-md mt-3 text-foreground">{draft.title}</h3>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-foreground/68">Updated {formatRelativeRelease(draft.updatedAt).replace("Published ", "")}</p>
                      <p className="body-sm mt-3 line-clamp-3">{draft.concept || draft.creativeDirection || "Add your first idea, references, and assets."}</p>
                      <div className="mt-4 flex flex-col gap-2">
                        <Button asChild variant="ghost" size="lg" className="w-full">
                          <Link href={`/workflows?draft=${draft.id}`}>Continue Draft</Link>
                        </Button>
                        <Button asChild size="lg" className="w-full">
                          <Link href={`/upload?workflowDraft=${draft.id}`}>Start Release</Link>
                        </Button>
                      </div>
                    </article>
                  ))}
                </HorizontalRail>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-white/10 pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="display-kicker">Draft Uploads</p>
                <h2 className="headline-lg mt-3">Recent uploads and edit-in-progress releases</h2>
              </div>
              <Button asChild variant="ghost" size="lg">
                <Link href="/upload">Start Another Release</Link>
              </Button>
            </div>

            {uploadDrafts.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
                <p className="display-kicker">No upload drafts yet</p>
                <p className="body-sm mt-3">When you start uploading clips, images, and audio, your in-progress releases appear here.</p>
              </div>
            ) : (
              <div className="mt-6">
                <HorizontalRail ariaLabel="upload drafts">
                  {uploadDrafts.map((film) => (
                    <article
                      key={film.id}
                      className="cinema-frame w-[min(84vw,18rem)] shrink-0 snap-start overflow-hidden rounded-none border border-white/30 bg-black p-4 shadow-[0_14px_34px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(116,124,136,0.3)] transition hover:border-white/40 hover:shadow-[0_18px_40px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.34),inset_0_-1px_0_rgba(116,124,136,0.34)] sm:w-[17rem]"
                    >
                      <FilmArtwork
                        artworkUrl={getFilmArtworkUrl({ posterUrl: film.posterUrl, muxPlaybackId: film.muxPlaybackId })}
                        previewUrl={film.muxPlaybackId ? getMuxAnimatedPreviewUrl(film.muxPlaybackId) : null}
                        title={film.title}
                        className="rounded-none border-white/18"
                        maxHeight="240px"
                      />
                      <p className="display-kicker mt-4">{getFilmCategoryLabel(film.category)}</p>
                      <h3 className="title-md mt-2 text-foreground">{film.title}</h3>
                      <p className="body-sm mt-2 line-clamp-2">{film.synopsis || "Continue shaping this release draft."}</p>
                      <Button asChild variant="ghost" size="lg" className="mt-4 w-full">
                        <Link href={`/upload?film=${film.id}`}>Continue Editing</Link>
                      </Button>
                    </article>
                  ))}
                </HorizontalRail>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-white/10 pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="display-kicker">Releases</p>
                <h2 className="headline-lg mt-3">Published work in poster-led format</h2>
              </div>
              <Button asChild variant="ghost" size="lg">
                <Link href="/feed">Explore Public Feed</Link>
              </Button>
            </div>

            {publishedReleases.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
                <p className="display-kicker">No public releases yet</p>
                <p className="body-sm mt-3">Publish your first release to build your filmmaker presence.</p>
              </div>
            ) : (
              <div className="mt-6">
                <HorizontalRail ariaLabel="published releases">
                  {publishedReleaseCards.map((film) => (
                    <div key={film.id} className="w-[min(68vw,12.25rem)] shrink-0 snap-start sm:w-[12rem] lg:w-[12.5rem]">
                      <PublicFilmCard film={film} compact />
                    </div>
                  ))}
                </HorizontalRail>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-white/10 pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="display-kicker">Notifications</p>
                <h2 className="headline-lg mt-3">Recent community signals and updates</h2>
              </div>
              <Button asChild variant="ghost" size="lg">
                <Link href="/dashboard">Refresh</Link>
              </Button>
            </div>

            {notifications.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
                <p className="display-kicker">No notifications yet</p>
                <p className="body-sm mt-3">Likes, comments, follows, and staff picks appear here.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-3">
                {notifications.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 transition hover:border-white/24 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    <p className="text-sm text-foreground">{item.message}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {item.read ? "Read" : "Unread"} / {formatRelativeRelease(item.createdAt).replace("Published ", "")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  } catch (error) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="The creator workspace could not be loaded"
          description={error instanceof Error ? error.message : "An unexpected error occurred."}
        />
      </section>
    );
  }
}
