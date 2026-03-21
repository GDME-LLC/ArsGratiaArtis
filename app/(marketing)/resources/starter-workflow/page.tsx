import Link from "next/link";

import { SectionShell } from "@/components/marketing/section-shell";
import { WorkflowBuilder } from "@/components/workflows/workflow-builder";
import { PageIntro } from "@/components/shared/page-intro";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

export default async function StarterWorkflowPage() {
  const signedIn = hasSupabaseServerEnv() ? Boolean(await getUser()) : false;

  return (
    <SectionShell className="py-14 sm:py-16">
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="ghost" size="lg">
          <Link href="/resources">Back to Resources</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-6">
        <div className="surface-panel cinema-frame relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(199,166,106,0.14),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(149,52,80,0.12),transparent_24%),linear-gradient(140deg,rgba(255,255,255,0.04),transparent_54%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
            <PageIntro
              eyebrow="Workflow builder"
              title="Build your first workflow."
              description="Move from idea to release with a clearer path. Choose a goal, define the constraints, surface the right tools, and save the process so you can continue it from Creator Studio."
            />
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 sm:p-6">
              <p className="display-kicker">What this tool does</p>
              <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                <p>Choose the kind of film workflow you need right now.</p>
                <p>Adjust the process around real constraints and current tools.</p>
                <p>Save the resulting workflow to your account and keep shaping it later.</p>
              </div>
              <p className="mt-5 text-sm text-foreground">{signedIn ? "You can generate and save workflows immediately." : "You can generate a workflow now and sign in when you are ready to save it."}</p>
            </div>
          </div>
        </div>

        <WorkflowBuilder signedIn={signedIn} />
      </div>
    </SectionShell>
  );
}