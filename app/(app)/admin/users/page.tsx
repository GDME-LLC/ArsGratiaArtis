import { redirect } from "next/navigation";

import { AdminToolsNav } from "@/components/admin/admin-tools-nav";
import { AdminUserManagementPanel } from "@/components/admin/admin-user-management-panel";
import { SectionShell } from "@/components/marketing/section-shell";
import { StatePanel } from "@/components/shared/state-panel";
import { getAdminUser } from "@/lib/admin";
import { listAdminUsers } from "@/lib/admin-users";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <SectionShell className="py-20">
        <StatePanel
          title="Admin user controls need a live database connection"
          description="The page can render locally, but user management requires live auth and database access."
        />
      </SectionShell>
    );
  }

  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/dashboard");
  }

  try {
    const overview = await listAdminUsers();

    return (
      <SectionShell className="py-14 sm:py-16">
        <AdminToolsNav current="users" />

        <div className="mt-6 max-w-3xl">
          <p className="display-kicker">Admin Tools</p>
          <h1 className="headline-xl mt-4">User management</h1>
          <p className="body-lg mt-4">
            Select multiple user accounts, including seeded creators, and remove them with an explicit redundancy prompt before anything is deleted.
          </p>
        </div>

        <div className="mt-8">
          <AdminUserManagementPanel overview={overview} />
        </div>
      </SectionShell>
    );
  } catch (error) {
    return (
      <SectionShell className="py-20">
        <StatePanel
          title="User controls could not be loaded"
          description={error instanceof Error ? error.message : "An unexpected error occurred."}
        />
      </SectionShell>
    );
  }
}
