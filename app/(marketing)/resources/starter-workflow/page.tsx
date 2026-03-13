import Link from "next/link";

import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { Button } from "@/components/ui/button";
import { starterWorkflow } from "@/lib/constants/resources";

export default function StarterWorkflowPage() {
  return (
    <SectionShell className="py-14 sm:py-16">
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="ghost" size="lg">
          <Link href="/resources">Back to Resources</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.35fr)]">
        <div className="surface-panel p-6 sm:p-7">
          <PageIntro
            eyebrow="Starter workflow"
            title="A clean path from idea to finished short."
            description="The fastest way to improve is to finish work. This sequence keeps the process focused, limits wasted generation, and gives new creators a reliable path to something worth publishing."
          />
        </div>

        <div className="grid gap-4">
          {starterWorkflow.map((item, index) => (
            <article
              key={item.step}
              className="surface-panel flex gap-4 p-5 sm:p-6"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </div>
              <div>
                <h2 className="title-md text-foreground">{item.step}</h2>
                <p className="body-sm mt-2">{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
