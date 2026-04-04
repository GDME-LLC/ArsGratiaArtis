import { redirect } from "next/navigation";

import { AdminToolsNav } from "@/components/admin/admin-tools-nav";
import { AdminFilmPanel } from "@/components/admin/admin-film-panel";
import { AdminUserManagementPanel } from "@/components/admin/admin-user-management-panel";
import { SectionShell } from "@/components/marketing/section-shell";
import { StatePanel } from "@/components/shared/state-panel";
import { getAdminUser } from "@/lib/admin";
import { listAdminModerationContent } from "@/lib/admin-films";
import { listAdminUsers } from "@/lib/admin-users";
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
    const [overview, userOverviewResult] = await Promise.all([
      listAdminModerationContent(params?.q ?? ""),
      listAdminUsers().catch((error) => ({ error })),
    ]);
    const userOverview = "error" in userOverviewResult ? null : userOverviewResult;
    const userOverviewError = "error" in userOverviewResult
      ? userOverviewResult.error instanceof Error
        ? userOverviewResult.error.message
        : "User management tools could not be loaded."
      : null;

    return (
      <SectionShell className="py-14 sm:py-16">
        <AdminToolsNav current="films" />

        <div className="mt-6 max-w-3xl">
          <p className="display-kicker">Admin Tools</p>
          <h1 className="headline-xl mt-4">Moderation tools</h1>
          <p className="body-lg mt-4">
            Search across films and creators, and manage user accounts from the same moderation workspace.
          </p>
        </div>

        <div className="mt-8">
          <AdminFilmPanel overview={overview} />
        </div>

        <div className="mt-10">
          <div className="max-w-3xl">
            <p className="display-kicker">Moderation Tools</p>
            <h2 className="headline-lg mt-3">Users</h2>
            <p className="body-sm mt-3">
              Review and manage user accounts without leaving moderation tools.
            </p>
          </div>

          <div className="mt-6">
            {userOverview ? (
              <AdminUserManagementPanel overview={userOverview} />
            ) : (
              <StatePanel
                title="User tools could not be loaded"
                description={userOverviewError ?? "An unexpected error occurred while loading user tools."}
              />
            )}
          </div>
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
