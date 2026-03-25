import { redirect } from "next/navigation";

import { AdminToolsNav } from "@/components/admin/admin-tools-nav";
import { AdminFilmPanel } from "@/components/admin/admin-film-panel";
import { SectionShell } from "@/components/marketing/section-shell";
import { StatePanel } from "@/components/shared/state-panel";
import { getAdminUser } from "@/lib/admin";
import { listAdminReportedContent } from "@/lib/admin-films";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

type AdminFilmsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function AdminFilmsPage({ searchParams }: AdminFilmsPageProps) {
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
    const params = searchParams ? await searchParams : undefined;
    const overview = await listAdminReportedContent(params?.q ?? "");

    return (
      <SectionShell className="py-14 sm:py-16">
        <AdminToolsNav current="films" />

        <div className="mt-6 max-w-3xl">
          <p className="display-kicker">Admin Tools</p>
          <h1 className="headline-xl mt-4">Moderation tools</h1>
          <p className="body-lg mt-4">
            Search across reported films and users, review the active report queue, and take visibility actions only where a human decision is needed.
          </p>
        </div>

        <div className="mt-8">
          <AdminFilmPanel overview={overview} />
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
