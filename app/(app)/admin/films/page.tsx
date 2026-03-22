import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminToolsNav } from "@/components/admin/admin-tools-nav";
import { AdminFilmPanel } from "@/components/admin/admin-film-panel";
import { SectionShell } from "@/components/marketing/section-shell";
import { StatePanel } from "@/components/shared/state-panel";
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
        <AdminToolsNav current="films" />

        <div className="mt-6 max-w-3xl">
          <p className="display-kicker">Admin Tools</p>
          <h1 className="headline-xl mt-4">Moderation tools</h1>
          <p className="body-lg mt-4">
            Review recent film records, check public status, and use controlled visibility actions when platform quality or safety needs a human hand.
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
