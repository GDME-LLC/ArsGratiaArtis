import Link from "next/link";
import { redirect } from "next/navigation";

import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { ensureProfileForUser } from "@/lib/profiles";
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
                Manage your public profile now. Film uploads are intentionally not implemented yet.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="xl">
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
                Turn creator mode on in settings when you want your profile positioned for publishing.
              </p>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-white/5 p-6">
              <p className="display-kicker">Bio</p>
              <p className="body-sm mt-3">
                {profile.bio || "No bio yet. Add one in settings to make your public page feel authored."}
              </p>
            </article>
          </div>

          <div className="mt-8 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
            <p className="display-kicker">Next</p>
            <p className="title-md mt-3 text-foreground">Film uploads are not part of this slice.</p>
            <p className="body-sm mt-3">
              The current implemented scope is profile creation, editing, and public creator pages.
            </p>
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
