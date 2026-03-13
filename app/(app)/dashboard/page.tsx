import Link from "next/link";
import { redirect } from "next/navigation";

import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { ensureProfileForUser } from "@/lib/profiles";
import { listCreatorFilms } from "@/lib/services/films";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

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
    const films = profile ? await listCreatorFilms(profile.id) : [];

    if (!profile) {
      return (
        <section className="container-shell py-20">
          <StatePanel
            title="Profile unavailable"
            description="Your account is signed in, but the creator record could not be loaded cleanly."
          />
        </section>
      );
    }

    return (
      <section className="container-shell py-14">
        <div className="surface-panel cinema-frame p-6 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="display-kicker">Dashboard</p>
              <h1 className="headline-xl mt-4">
                {profile.displayName || profile.handle}
              </h1>
              <p className="body-lg mt-4">
                Prepare releases, shape your public page, and keep the next film moving without losing the thread.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {profile.isCreator ? (
                <Button asChild size="lg">
                  <Link href="/upload">Start New Release</Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href="/settings">Enable Creator Mode</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="lg">
                <Link href="/settings">Edit Profile</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href={`/creator/${profile.handle}`}>View Public Page</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="display-kicker">Handle</p>
              <p className="title-md mt-3 text-foreground">@{profile.handle}</p>
              <p className="body-sm mt-3">
                This is the address viewers will return to when the work starts to circulate.
              </p>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="display-kicker">Creator Status</p>
              <p className="title-md mt-3 text-foreground">
                {profile.isCreator ? "Creator profile enabled" : "Viewer profile"}
              </p>
              <p className="body-sm mt-3">
                {profile.isCreator
                  ? "Drafts, film pages, and release controls are active for this account."
                  : "Turn creator mode on in settings when you are ready to prepare work for release."}
              </p>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="display-kicker">Bio</p>
              <p className="body-sm mt-3">
                {profile.bio || "No public bio yet. Add one in settings so the page carries some authorship before the first visitor arrives."}
              </p>
            </article>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="display-kicker">Films</p>
                <h2 className="headline-lg mt-3">Releases in progress and already out in public</h2>
              </div>
              {profile.isCreator ? (
                <Button asChild variant="ghost" size="lg">
                  <Link href="/upload">Start Another Draft</Link>
                </Button>
              ) : null}
            </div>

            {!profile.isCreator ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
                <p className="display-kicker">Creator Mode</p>
                <p className="title-md mt-3 text-foreground">Release tools are not active yet</p>
                <p className="body-sm mt-3">
                  Enable creator mode in settings to open draft tools, publish poster-led pages, and prepare films for release from this workspace.
                </p>
              </div>
            ) : films.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
                <p className="display-kicker">First Release</p>
                <p className="title-md mt-3 text-foreground">No films in your workspace yet</p>
                <p className="body-sm mt-3">
                  Start with a draft page. Poster-led releases are supported, so you can publish the film page first and attach video when the cut is ready.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {films.map((film) => (
                  <article
                    key={film.id}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-3xl">
                        <p className="display-kicker">
                          {film.publishStatus} / {film.visibility}
                        </p>
                        <h3 className="title-md mt-3 text-foreground">{film.title}</h3>
                        <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                          slug / {film.slug}
                        </p>
                        <p className="body-sm mt-3">
                          {film.synopsis || "No synopsis written yet."}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        {film.publishStatus === "draft" ? (
                          <Button asChild variant="ghost" size="lg">
                            <Link href={`/upload?film=${film.id}`}>Continue Editing</Link>
                          </Button>
                        ) : null}
                        {film.publishStatus === "published" && film.visibility === "public" ? (
                          <Button asChild size="lg">
                            <Link href={`/film/${film.slug}`}>Open Public Release</Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </article>
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
