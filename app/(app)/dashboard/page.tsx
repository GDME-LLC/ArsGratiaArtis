import Link from "next/link";
import { redirect } from "next/navigation";

import { CreatorBadgeList } from "@/components/badges/creator-badge-list";
import { FilmArtwork } from "@/components/films/film-artwork";
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

    return (
      <section className="container-shell py-14">
        <div className="surface-panel cinema-frame p-6 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="display-kicker">Creator Hub</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="headline-xl">{profile.displayName || profile.handle}</h1>
                <CreatorBadgeList badges={profile.badges} />
              </div>
              <p className="mt-2 text-sm text-foreground/72">@{profile.handle}</p>
              <p className="body-lg mt-4">
                Build films one step at a time from this hub: start a project, add clips and notes, share progress, and publish when ready.
              </p>
              {profile.foundingCreator.isFoundingCreator ? (
                <p className="mt-3 text-sm text-foreground/84">
                  Founding Creator{founderSince ? ` since ${founderSince}` : ""}.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg">
                <Link href="/workflows">Start Project</Link>
              </Button>
              {nextDraft ? (
                <Button asChild variant="ghost" size="lg">
                  <Link href={`/workflows?draft=${nextDraft.id}`}>Continue Draft</Link>
                </Button>
              ) : null}
              <Button asChild variant="ghost" size="lg">
                <Link href="/upload">Upload Clip</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/settings">Edit Profile</Link>
              </Button>
              {isAdmin ? (
                <Button asChild variant="ghost" size="lg">
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <article className="rounded-[20px] border border-white/10 bg-white/5 p-4">
              <p className="display-kicker">Followers</p>
              <p className="title-md mt-3 text-foreground">{followerCount}</p>
            </article>
            <article className="rounded-[20px] border border-white/10 bg-white/5 p-4">
              <p className="display-kicker">Notifications</p>
              <p className="title-md mt-3 text-foreground">{unreadNotificationCount} unread</p>
            </article>
            <article className="rounded-[20px] border border-white/10 bg-white/5 p-4">
              <p className="display-kicker">Badges</p>
              <p className="title-md mt-3 text-foreground">{profile.badges.length}</p>
            </article>
            <article className="rounded-[20px] border border-white/10 bg-white/5 p-4">
              <p className="display-kicker">Current Projects</p>
              <p className="title-md mt-3 text-foreground">{projectDrafts.length}</p>
            </article>
            <article className="rounded-[20px] border border-white/10 bg-white/5 p-4">
              <p className="display-kicker">Releases</p>
              <p className="title-md mt-3 text-foreground">{releaseCount}</p>
            </article>
          </div>

          <div className="mt-8 rounded-[24px] border border-white/10 bg-black/20 p-5 sm:p-6">
            <p className="display-kicker">Next Actions</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg">
                <Link href="/workflows">Start Project</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href={nextDraft ? `/workflows?draft=${nextDraft.id}` : "/workflows"}>Add Notes</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/upload">Add Image</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/upload">Add Voice</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/workflows">Connect Tool</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/workflows">Share Progress</Link>
              </Button>
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
                      className="cinema-frame w-[min(84vw,18rem)] shrink-0 snap-start overflow-hidden rounded-none border border-white/30 bg-black p-4 shadow-[0_14px_34px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(116,124,136,0.3)] sm:w-[17rem]"
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
                      className="cinema-frame w-[min(84vw,18rem)] shrink-0 snap-start overflow-hidden rounded-none border border-white/30 bg-black p-4 shadow-[0_14px_34px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(116,124,136,0.3)] sm:w-[17rem]"
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
                  {publishedReleases.map((film) => (
                    <article
                      key={film.id}
                      className="cinema-frame w-[min(84vw,18rem)] shrink-0 snap-start overflow-hidden rounded-none border border-white/30 bg-black p-4 shadow-[0_14px_34px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(116,124,136,0.3)] sm:w-[17rem]"
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
                      <p className="body-sm mt-2 line-clamp-2">{film.synopsis || "Published release on your profile."}</p>
                      <Button asChild size="lg" className="mt-4 w-full">
                        <Link href={`/film/${film.slug}`}>Open Release</Link>
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
                    className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.08]"
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
