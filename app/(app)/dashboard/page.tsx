import Link from "next/link";
import { redirect } from "next/navigation";

import { CreatorBadgeList } from "@/components/badges/creator-badge-list";
import { FilmArtwork } from "@/components/films/film-artwork";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { hasAdminAccess } from "@/lib/admin";
import { getFilmArtworkUrl, getMuxAnimatedPreviewUrl } from "@/lib/films/artwork";
import { getFilmCategoryLabel } from "@/lib/films/categories";
import { getModerationStatusDescription, getModerationStatusLabel } from "@/lib/films/moderation";
import { ensureProfileForUser } from "@/lib/profiles";
import { listCreatorFilms } from "@/lib/services/films";
import { listCreatorWorkflowDrafts } from "@/lib/services/workflows";
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

    const [films, workflowDrafts] = await Promise.all([
      listCreatorFilms(profile.id),
      listCreatorWorkflowDrafts(profile.id, 24),
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
                Shape project foundations in Workflow Tool, develop them in Creator Studio, and move to release when the work is ready.
              </p>
              {profile.foundingCreator.isFoundingCreator ? (
                <p className="mt-3 text-sm text-foreground/84">
                  Founding Creator{founderSince ? ` since ${founderSince}` : ""}. One of the first 20 creators on ArsNeos.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg">
                <Link href="/upload">Start a Project</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/workflows">Workflow Tool</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/settings">Creator Studio</Link>
              </Button>
              {/* No separate 'My Studio' button; all navigation is via Creator Studio */}
              {isAdmin ? (
                <Button asChild variant="ghost" size="lg">
                  <Link href="/admin">Admin Tools</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="display-kicker">Creator Studio</p>
              <p className="title-md mt-3 text-foreground">@{profile.handle}</p>
              <p className="body-sm mt-3">
                Edit your public identity, fine-tune your Studio presentation, and manage publishing access in Creator Studio. Your Studio is your public hub for your work, links, and creative identity.
              </p>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="display-kicker">Workflow Tool</p>
              <p className="title-md mt-3 text-foreground">Upstream project planning before release</p>
              <p className="body-sm mt-3">
                Capture concept, direction, tools, and early structure before moving the project into Start a Project.
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
                  ? "Permanent recognition as one of the first 20 creators on ArsNeos."
                  : "The founding tier is assigned manually to a permanent roster of the first 20 creators."}
              </p>
            </article>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="display-kicker">Workflow Tool</p>
                <h2 className="headline-lg mt-3">Workflow drafts that seed Creator Studio projects</h2>
              </div>
              <Button asChild variant="ghost" size="lg">
                <Link href="/workflows">Open Workflow Tool</Link>
              </Button>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-6">
              <p className="display-kicker">Project Pipeline</p>
              <p className="title-md mt-3 text-foreground">Workflow Tool -&gt; Draft Project -&gt; Creator Studio -&gt; Start a Project</p>
              <p className="body-sm mt-3">
                Workflow Tool is part of Creator Studio: begin early structure there, then continue in Start a Project and move to release later in the lifecycle.
              </p>
            </div>

            {workflowDrafts.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
                <p className="display-kicker">Workflow Drafts</p>
                <p className="title-md mt-3 text-foreground">No saved workflow drafts yet</p>
                <p className="body-sm mt-3">
                  Start in Workflow Tool, save a draft, and continue later from this Creator Studio history.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-3">
                {workflowDrafts.map((draft) => (
                  <article key={draft.id} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="display-kicker">Workflow Draft / {draft.status}</p>
                        <h3 className="title-md mt-2 text-foreground">{draft.title}</h3>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Updated {new Date(draft.updatedAt).toLocaleDateString()}</p>
                        <p className="body-sm mt-3">{draft.concept || draft.creativeDirection || "Project seed ready for Start a Project."}</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Button asChild size="lg" variant="ghost">
                          <Link href={`/workflows?draft=${draft.id}`}>Continue Later</Link>
                        </Button>
                        <Button asChild size="lg">
                          <Link href={`/upload?workflowDraft=${draft.id}`}>Start a Project</Link>
                        </Button>
                      </div>
                    </div>
                  </article>
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
                  <Link href="/upload">Start Another Project</Link>
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
                <p className="display-kicker">First Project</p>
                <p className="title-md mt-3 text-foreground">No projects in your workspace yet</p>
                <p className="body-sm mt-3">
                  Start with a project draft. You can shape title, poster, synopsis, and structure first, then publish the release when the final cut is ready.
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
                              <div className="mt-4 rounded-[18px] border border-white/18 bg-white/8 px-4 py-3 text-sm text-foreground/88">
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
