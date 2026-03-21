import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkflowBuilder } from "@/components/workflows/workflow-builder";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { ensureProfileForUser } from "@/lib/profiles";
import { getCreatorWorkflowById } from "@/lib/services/workflows";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

type WorkflowPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  if (!hasSupabaseServerEnv()) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Workflow editing needs a live database connection"
          description="Saved workflows only load once Supabase is connected."
        />
      </section>
    );
  }

  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await ensureProfileForUser(user);

  if (!profile) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Profile unavailable"
          description="Your session is active, but the creator record could not be loaded."
        />
      </section>
    );
  }

  const { id } = await params;
  const workflow = await getCreatorWorkflowById(id, profile.id);

  if (!workflow) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Workflow not found"
          description="This saved workflow could not be found for the signed-in creator."
        />
      </section>
    );
  }

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
      <WorkflowBuilder signedIn initialWorkflow={workflow} />
    </section>
  );
}