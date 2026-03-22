import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { ensureProfileForUser } from "@/lib/profiles";
import { listCreatorFilms } from "@/lib/services/films";
import { listCreatorWorkflows } from "@/lib/services/workflows";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

export default async function SettingsPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Creator Studio is in local fallback mode"
          description="The app shell can render without Supabase, but private studio editing activates only after auth env vars are configured."
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
            title="Creator Studio unavailable"
            description="Your session is active, but the creator record could not be loaded."
          />
        </section>
      );
    }

    const [availableFilms, workflows] = await Promise.all([
      listCreatorFilms(profile.id),
      listCreatorWorkflows(profile.id),
    ]);

    return (
      <section className="container-shell py-12 sm:py-20">
        <div className="mb-5 flex flex-wrap gap-2.5 sm:mb-6 sm:gap-3">
          <Button asChild variant="ghost" size="lg">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href={`/creator/${profile.handle}`}>My Theatre</Link>
          </Button>
        </div>
        <ProfileSettingsForm profile={profile} availableFilms={availableFilms} workflows={workflows} />
      </section>
    );
  } catch (error) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Creator Studio failed to load"
          description={error instanceof Error ? error.message : "An unexpected error occurred."}
        />
      </section>
    );
  }
}

