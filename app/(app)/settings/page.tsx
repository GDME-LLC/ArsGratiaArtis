import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { listCreatorFilms } from "@/lib/services/films";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";
import { ensureProfileForUser } from "@/lib/profiles";

export default async function SettingsPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Settings are in local fallback mode"
          description="The app shell can render without Supabase, but profile editing activates only after auth env vars are configured."
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
            description="Your session is active, but the profile record could not be loaded."
          />
        </section>
      );
    }

    const availableFilms = await listCreatorFilms(profile.id);

    return (
      <section className="container-shell py-14 sm:py-20">
        <div className="mb-6 flex flex-wrap gap-3">
          <Button asChild variant="ghost" size="lg">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href={`/creator/${profile.handle}`}>Visit Theatre</Link>
          </Button>
        </div>
        <ProfileSettingsForm profile={profile} availableFilms={availableFilms} />
      </section>
    );
  } catch (error) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Profile settings failed to load"
          description={error instanceof Error ? error.message : "An unexpected error occurred."}
        />
      </section>
    );
  }
}