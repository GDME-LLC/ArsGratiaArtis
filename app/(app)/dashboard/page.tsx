import Link from "next/link";
import { redirect } from "next/navigation";

import { CreatorBadgeList } from "@/components/badges/creator-badge-list";
import { FilmArtwork } from "@/components/films/film-artwork";
import { StatePanel } from "@/components/shared/state-panel";
import { SavedWorkflowCard } from "@/components/workflows/saved-workflow-card";
import { Button } from "@/components/ui/button";
import { hasAdminAccess } from "@/lib/admin";
import { getFilmArtworkUrl, getMuxAnimatedPreviewUrl } from "@/lib/films/artwork";
import { getFilmCategoryLabel } from "@/lib/films/categories";
import { getModerationStatusDescription, getModerationStatusLabel } from "@/lib/films/moderation";
import { ensureProfileForUser } from "@/lib/profiles";
import { listCreatorFilms } from "@/lib/services/films";
import { listCreatorWorkflows } from "@/lib/services/workflows";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";
import { formatMonthYear } from "@/lib/utils";

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

    const [films, workflows] = await Promise.all([
      listCreatorFilms(profile.id),
      listCreatorWorkflows(profile.id),
    ]);
    const isAdmin = await hasAdminAccess(user);
    const founderSince = formatMonthYear(profile.foundingCreator.awardedAt ?? null);

    return (
      <section className="container-shell py-14">
        <div className="surface-panel cinema-frame p-6 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="display-kicker">Dashboard</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="headline-xl">{profile.displayName || profile.handle}</h1>
                <CreatorBadgeList badges={profile.badges} />
              </div>
              <p className="body-lg mt-4">
                Prepare releases, direct your Theatre, and keep the next film moving without losing the thread.
              </p>
              {profile.foundingCreator.isFoundingCreator ? (
                <p className="mt-3 text-sm text-[#e7d1a0]">
                  Founding Creator{founderSince ? ` since ${founderSince}` : ""}. One of the first 20 creators on ArsGratia.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {profile.isCreator ? (
                <Button asChild size="lg">
                  <Link href="/upload">Start New Release</Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href="/settings">Open Creator Studio</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="lg">
                <Link href="/settings">Creator Studio</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href={`/creator/${profile.handle}`}>My Theatre</Link>
              </Button>
              {isAdmin ? (
                <>
                  <Button asChild variant="ghost" size="lg">
                    <Link href="/admin">Admin Tools</Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg">
                    <Link href="/admin/badges">Badge Management</Link>
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="display-kicker">Handle</p>
              <p className="title-md mt-3 text-foreground">@{profile.handle}</p>
              <p className="body-sm mt-3">
                This is the address viewers will return to when your releases start circulating.
              </p>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="display-kicker">Creator Access</p>
              <p className="title-md mt-3 text-foreground">
                {profile.isCreator ? "Publishing tools enabled" : "Account active, publishing access pending"}
              </p>
              <p className="body-sm mt-3">
                {profile.isCreator
                  ? "Drafts, release pages, and publishing controls are active for this account."
                  : "New accounts can sign in immediately, while creator publishing access is enabled separately in smaller groups."}
              </p>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="display-kicker">Founding Status</p>
              <p className="title-md mt-3 text-foreground">
                {profile.foundingCreator.isFoundingCreator
                  ? `Founding Creator${profile.foundingCreator.founderNumber ? ` #${profile.foundingCreator.founderNumber}` : ""}`
                  : "Not on the founding roster"}
              </p>
              <p className="body-sm mt-3">
                {profile.foundingCreator.isFoundingCreator
                  ? "Permanent recognition as one of the first 20 creators on ArsGratia."
                  : "The founding tier is assigned manually to a permanent roster of the first 20 creators."}
              </p>
            </article>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="display-kicker">Creative Workflows</p>
                <h2 className="headline-lg mt-3">Saved workflow drafts and active production paths</h2>
              </div>
              <Button asChild variant="ghost" size="lg">
                <Link href="/resources/starter-workflow">Build your first workflow</Link>
              </Button>
            </div>

            {workflows.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
                <p className="display-kicker">Workflow Builder</p>
                <p className="title-md mt-3 text-foreground">No saved workflows yet</p>
                <p className="body-sm mt-3">
                  Build a workflow that fits how you actually make films, then keep refining it inside Creator Studio as the work moves toward release.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {workflows.map((workflow) => (
                  <SavedWorkflowCard key={workflow.id} workflow={workflow} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-white/10 pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="display-kicker">Releases</p>
                <h2 className="headline-lg mt-3">Drafts, poster-led pages, and published work</h2>
              </div>
              {profile.isCreator ? (
                <Button asChild variant="ghost" size="lg">
                  <Link href="/upload">Start Another Draft</Link>
                </Button>
              ) : null}
            </div>

            {!profile.isCreator ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
                <p className="display-kicker">Creator Access</p>
                <p className="title-md mt-3 text-foreground">Publishing tools are not active yet</p>
                <p className="body-sm mt-3">
                  Complete your profile first. Creator publishing access is enabled separately so filmmaker pages and early releases can be onboarded with care.
                </p>
              </div>
            ) : films.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
                <p className="display-kicker">First Release</p>
                <p className="title-md mt-3 text-foreground">No releases in your workspace yet</p>
                <p className="body-sm mt-3">
                  Start with a draft release page. Poster-led release pages are supported, so artwork, title, and synopsis can go live before the final video is attached.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {films.map((film) => {
                  const moderationLabel = getModerationStatusLabel(film.moderationStatus);
                  const moderationDescription = getModerationStatusDescription(film.moderationStatus, film.moderationReason);

                  return (
                    <article key={film.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-4">
                          <div className="w-[120px] shrink-0">
                            <FilmArtwork
                              artworkUrl={getFilmArtworkUrl({
                                posterUrl: film.posterUrl,
                                muxPlaybackId: film.muxPlaybackId,
                              })}
                              previewUrl={film.muxPlaybackId ? getMuxAnimatedPreviewUrl(film.muxPlaybackId) : null}
                              title={film.title}
                              className="rounded-[20px]"
                            />
                          </div>
                          <div className="max-w-3xl">
                            <p className="display-kicker">
                              {film.publishStatus} / {film.visibility}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground/88">
                                {getFilmCategoryLabel(film.category)}
                              </p>
                              <p className="inline-flex rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground/88">
                                {moderationLabel}
                              </p>
                            </div>
                            <h3 className="title-md mt-3 text-foreground">{film.title}</h3>
                            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                              slug / {film.slug}
                            </p>
                            <p className="body-sm mt-3">
                              {film.synopsis || "No synopsis added yet."}
                            </p>
                            {film.moderationStatus !== "active" ? (
                              <div className="mt-4 rounded-[18px] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                                {moderationDescription}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          {film.publishStatus === "draft" ? (
                            <Button asChild variant="ghost" size="lg">
                              <Link href={`/upload?film=${film.id}`}>Continue Editing</Link>
                            </Button>
                          ) : null}
                          {film.publishStatus === "published" && film.visibility === "public" ? (
                            <Button asChild size="lg">
                              <Link href={`/film/${film.slug}`}>Open Release Page</Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
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





