import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminFilmPanel } from "@/components/admin/admin-film-panel";
import { SectionShell } from "@/components/marketing/section-shell";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { getAdminUser } from "@/lib/admin";
import { listAdminFilms } from "@/lib/admin-films";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

export default async function AdminFilmsPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <SectionShell className="py-20">
        <StatePanel
          title="Admin film controls need a live database connection"
          description="The page can render locally, but recent film management requires live auth and database access."
        />
      </SectionShell>
    );
  }

  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/dashboard");
  }

  try {
    const films = await listAdminFilms(40);

    return (
      <SectionShell className="py-14 sm:py-16">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="ghost" size="lg">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/founding-creators">Founding Creators</Link>
          </Button>
        </div>

        <div className="mt-6 max-w-3xl">
          <p className="display-kicker">Admin</p>
          <h1 className="headline-xl mt-4">Film management</h1>
          <p className="body-lg mt-4">
            A restrained admin surface for recent film review. This keeps status checks and emergency visibility actions close at hand without expanding into a full moderation console yet.
          </p>
        </div>

        <div className="mt-8">
          <AdminFilmPanel films={films} />
        </div>
      </SectionShell>
    );
  } catch (error) {
    return (
      <SectionShell className="py-20">
        <StatePanel
          title="Film controls could not be loaded"
          description={error instanceof Error ? error.message : "An unexpected error occurred."}
        />
      </SectionShell>
    );
  }
}
