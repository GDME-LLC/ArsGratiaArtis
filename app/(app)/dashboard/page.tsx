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
          title="Dashboard is in local fallback mode"
          description="The app shell is running locally without Supabase. Add auth env vars to activate real profile loading and persistence."
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
            description="Your account is signed in, but the profile record could not be created or loaded."
          />
        </section>
      );
    }

    return (
      <section className="container-shell py-16">
        <div className="surface-panel cinema-frame p-8 sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="display-kicker">Dashboard</p>
              <h1 className="headline-xl mt-4">
                {profile.displayName || profile.handle}
              </h1>
              <p className="body-lg mt-4">
                Manage your public profile and draft films from a single creator workspace.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {profile.isCreator ? (
                <Button asChild size="xl">
                  <Link href="/upload">Create Draft Film</Link>
                </Button>
              ) : (
                <Button asChild size="xl">
                  <Link href="/settings">Enable Creator Mode</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="xl">
                <Link href="/settings">Edit Profile</Link>
              </Button>
              <Button asChild variant="ghost" size="xl">
                <Link href={`/creator/${profile.handle}`}>View Public Page</Link>
              </Button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <article className="rounded-[24px] border border-white/10 bg-white/5 p-6">
              <p className="display-kicker">Handle</p>
              <p className="title-md mt-3 text-foreground">@{profile.handle}</p>
              <p className="body-sm mt-3">
                This powers your public creator URL and profile identity.
              </p>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-white/5 p-6">
              <p className="display-kicker">Creator Status</p>
              <p className="title-md mt-3 text-foreground">
                {profile.isCreator ? "Creator profile enabled" : "Viewer profile"}
              </p>
              <p className="body-sm mt-3">
                {profile.isCreator
                  ? "Creator tools are live for this account, including draft film management."
                  : "Turn creator mode on in settings when you want your profile positioned for publishing."}
              </p>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-white/5 p-6">
              <p className="display-kicker">Bio</p>
              <p className="body-sm mt-3">
                {profile.bio || "No bio yet. Add one in settings to make your public page feel authored."}
              </p>
            </article>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="display-kicker">Films</p>
                <h2 className="headline-lg mt-3">Your draft and published films</h2>
              </div>
              {profile.isCreator ? (
                <Button asChild variant="ghost" size="xl">
                  <Link href="/upload">New Draft</Link>
                </Button>
              ) : null}
            </div>

            {!profile.isCreator ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
                <p className="display-kicker">Creator Mode</p>
                <p className="title-md mt-3 text-foreground">Film tools are currently locked</p>
                <p className="body-sm mt-3">
                  Enable creator mode in settings to create draft film entries from the dashboard or upload flow.
                </p>
              </div>
            ) : films.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
                <p className="display-kicker">Empty State</p>
                <p className="title-md mt-3 text-foreground">No films yet</p>
                <p className="body-sm mt-3">
                  Start by creating a draft film entry. You can refine the metadata now and add video delivery later.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {films.map((film) => (
                  <article
                    key={film.id}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-6"
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
                          {film.synopsis || "No synopsis yet."}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        {film.publishStatus === "draft" ? (
                          <Button asChild variant="ghost" size="lg">
                            <Link href={`/upload?film=${film.id}`}>Edit Draft</Link>
                          </Button>
                        ) : null}
                        {film.publishStatus === "published" && film.visibility === "public" ? (
                          <Button asChild size="lg">
                            <Link href={`/film/${film.slug}`}>View Public Film</Link>
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
          title="Dashboard failed to load"
          description={error instanceof Error ? error.message : "An unexpected error occurred."}
        />
      </section>
    );
  }
}
