import { redirect } from "next/navigation";

import { SectionShell } from "@/components/marketing/section-shell";
import { StatePanel } from "@/components/shared/state-panel";
import { getAdminUser } from "@/lib/admin";
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

  redirect("/admin/films");
}
