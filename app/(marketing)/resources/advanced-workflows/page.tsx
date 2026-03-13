import Link from "next/link";

import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { Button } from "@/components/ui/button";
import { advancedWorkflowIdeas } from "@/lib/constants/resources";

export default function AdvancedWorkflowsPage() {
  return (
    <SectionShell className="py-14 sm:py-16">
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="ghost" size="lg">
          <Link href="/resources">Back to Resources</Link>
        </Button>
      </div>

      <div className="mt-6 max-w-2xl">
        <PageIntro
          eyebrow="Advanced workflow ideas"
          title="For creators ready to turn experiments into a repeatable practice."
          description="Once the basic workflow is working, the real gains come from stronger continuity, better versioning, and cleaner presentation around the final film."
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {advancedWorkflowIdeas.map((idea) => (
          <article
            key={idea.title}
            className="surface-panel p-5 sm:p-6"
          >
            <p className="display-kicker">Advanced</p>
            <h2 className="title-md mt-3 text-foreground">{idea.title}</h2>
            <p className="body-sm mt-3">{idea.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
