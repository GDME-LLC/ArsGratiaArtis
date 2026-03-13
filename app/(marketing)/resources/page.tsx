import Link from "next/link";

import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { Button } from "@/components/ui/button";
import { resourceSections } from "@/lib/constants/resources";

export default function ResourcesPage() {
  return (
    <SectionShell className="py-14 sm:py-16">
      <div className="surface-panel cinema-frame relative overflow-hidden px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(199,166,106,0.12),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(149,52,80,0.12),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_52%)]" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)] lg:items-start">
          <div>
            <PageIntro
              eyebrow="Resources"
              title="Practical guidance for choosing tools and finishing stronger work."
              description="Use these pages to pick tools with more intention, build a cleaner process, and move from visual tests toward finished releases. The aim is practical help, not endless software lists."
            />

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="xl">
                <Link href="/resources/starter-workflow">Build your first workflow</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/resources/featured-tools">Review the tool picks</Link>
              </Button>
            </div>
          </div>

          <aside className="rounded-[24px] border border-white/10 bg-black/20 p-5 sm:p-6">
            <p className="display-kicker">How To Use This Page</p>
            <div className="mt-4 space-y-5">
              <div>
                <p className="title-md text-foreground">Start with one clear need</p>
                <p className="body-sm mt-2">
                  Need a shortlist? Start with the tool picks. Need a process? Start with the workflow. Need one missing piece? Browse by craft.
                </p>
              </div>
              <div>
                <p className="title-md text-foreground">Built for both first cuts and tighter finishing</p>
                <p className="body-sm mt-2">
                  New creators can use these pages to get unstuck quickly. More advanced creators can use them to tighten continuity, structure, and release presentation.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {resourceSections.map((section) => (
          <article
            key={section.href}
            className="surface-panel p-5 sm:p-6"
          >
            <p className="display-kicker">{section.eyebrow}</p>
            <h2 className="headline-lg mt-3 text-foreground">{section.title}</h2>
            <p className="body-lg mt-4">{section.description}</p>
            <div className="mt-6">
              <Button asChild variant="ghost" size="lg">
                <Link href={section.href}>{section.ctaLabel}</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
