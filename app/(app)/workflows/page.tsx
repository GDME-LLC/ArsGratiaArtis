import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkflowToolSurface } from "@/components/workflows/workflow-tool-surface";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { ensureProfileForUser } from "@/lib/profiles";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

type CreatorWorkflowsPageProps = {
  searchParams?: Promise<{
    draft?: string;
  }>;
};

export default async function CreatorWorkflowsPage({ searchParams }: CreatorWorkflowsPageProps) {
  const params = searchParams ? await searchParams : undefined;

  if (!hasSupabaseServerEnv()) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Project builder needs a live creator connection"
          description="This page can render in shell mode, but saving projects and drafts only works after Supabase is connected."
        />
      </section>
    );
  }

  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await ensureProfileForUser(user);

  return (
    <section className="container-shell py-6 sm:py-10 lg:py-14">
      <div className="mb-4 grid gap-2.5 sm:mb-6 sm:flex sm:flex-row sm:flex-wrap sm:gap-3">
        <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
        <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
          <Link href="/upload">Go to Upload</Link>
        </Button>
      </div>

      <div className="surface-panel cinema-frame app-stack-shell px-3 py-4 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <div className="relative isolate rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(190,155,89,0.22),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-3.5 py-4 sm:rounded-[28px] sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="max-w-3xl">
            <p className="display-kicker">Creator Hub</p>
            <h1 className="headline-lg mt-3 sm:mt-4">Project builder</h1>
            <p className="body-lg mt-3 max-w-2xl text-foreground/88 sm:mt-4">
              Start a project from scratch or continue a saved draft. Keep structure, notes, and assets together before moving into upload and release editing.
            </p>
          </div>
        </div>

        <div className="mt-4 min-w-0 sm:mt-6">
          <WorkflowToolSurface canPersist={Boolean(profile?.isCreator)} isSignedIn entryPoint="dashboard" initialDraftId={params?.draft ?? null} />
        </div>
      </div>
    </section>
  );
}
