import { redirect } from "next/navigation";

import { WorkflowToolSurface } from "@/components/workflows/workflow-tool-surface";
import { StatePanel } from "@/components/shared/state-panel";
import { ensureProfileForUser } from "@/lib/profiles";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

export default async function CreatorWorkflowsPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Workflow Tool needs live auth and database access"
          description="Local shell mode can render this surface, but creator persistence actions require Supabase to be connected."
        />
      </section>
    );
  }

  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await ensureProfileForUser(user);

  return <WorkflowToolSurface canPersist={Boolean(profile?.isCreator)} isSignedIn entryPoint="dashboard" />;
}
