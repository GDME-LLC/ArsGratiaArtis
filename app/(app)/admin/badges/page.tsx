import { redirect } from "next/navigation";

import { AdminBadgePanel } from "@/components/admin/admin-badge-panel";
import { AdminToolsNav } from "@/components/admin/admin-tools-nav";
import { SectionShell } from "@/components/marketing/section-shell";
import { StatePanel } from "@/components/shared/state-panel";
import { getAdminUser } from "@/lib/admin";
import { getAdminBadgeOverview } from "@/lib/services/badges";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

export default async function AdminBadgesPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <SectionShell className="py-20">
        <StatePanel
          title="Badge controls need a live database connection"
          description="The admin shell can render locally, but badge management requires real auth, profiles, and assignments."
        />
      </SectionShell>
    );
  }

  const adminUser = await getAdminUser();
  if (!adminUser) {
    redirect("/dashboard");
  }

  try {
    const overview = await getAdminBadgeOverview();

    return (
      <SectionShell className="py-14 sm:py-16">
        <AdminToolsNav current="badges" />

        <div className="mt-6 max-w-3xl">
          <p className="display-kicker">Admin Tools</p>
          <h1 className="headline-xl mt-4">Badge management</h1>
          <p className="body-lg mt-4">
            Manage curated creator distinctions, assign them cleanly, and keep public identity surfaces consistent across Theatres and releases.
          </p>
        </div>

        <div className="mt-8">
          <AdminBadgePanel overview={overview} />
        </div>
      </SectionShell>
    );
  } catch (error) {
    return (
      <SectionShell className="py-20">
        <StatePanel
          title="Badge controls could not be loaded"
          description={error instanceof Error ? error.message : "An unexpected error occurred."}
        />
      </SectionShell>
    );
  }
}
