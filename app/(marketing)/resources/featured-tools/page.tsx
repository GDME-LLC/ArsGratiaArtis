import Link from "next/link";

import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { Button } from "@/components/ui/button";
import { featuredTools } from "@/lib/constants/resources";

export default function FeaturedToolsPage() {
  return (
    <SectionShell className="py-14 sm:py-16">
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="ghost" size="lg">
          <Link href="/resources">Back to Resources</Link>
        </Button>
      </div>

      <div className="mt-6 max-w-2xl">
        <PageIntro
          eyebrow="Featured tools"
          title="A concise tool shortlist for creators who want to move with intent."
          description="These are strong starting points for shorts, proof-of-concepts, trailers, and finished pieces. Each one earns its place by solving a practical part of the workflow."
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {featuredTools.map((tool) => (
          <article
            key={tool.name}
            className="surface-panel group flex h-full flex-col p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="display-kicker">{tool.category}</p>
                <h2 className="title-md mt-3 text-foreground">{tool.name}</h2>
              </div>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary/90">
                Curated
              </span>
            </div>

            <p className="body-sm mt-4">{tool.description}</p>
            <p className="mt-4 text-sm leading-6 text-foreground/85">{tool.fit}</p>

            <div className="mt-6">
              <a
                href={tool.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm font-medium text-primary transition group-hover:text-primary/90"
              >
                Visit {tool.name}
              </a>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
