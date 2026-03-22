import Link from "next/link";

import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { featuredResources, resourcesByCategory } from "@/lib/constants/resources";

export default function FeaturedToolsPage() {
  return (
    <SectionShell className="py-14 sm:py-16">
      <div className="flex flex-wrap gap-3">
        <Link href="/resources" className="inline-flex min-h-11 items-center rounded-2xl border border-white/10 px-5 text-sm text-foreground transition hover:bg-white/[0.05]">
          Back to Resources
        </Link>
      </div>

      <div className="mt-6 max-w-2xl">
        <PageIntro
          eyebrow="Featured resources"
          title="A concise shortlist of widely used platforms."
          description="A quick editorial entry point into the broader AI cinema ecosystem, from production tools to learning hubs."
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {featuredResources.map((resource) => (
          <article key={resource.name} className="surface-panel group flex h-full flex-col p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="display-kicker">{resourcesByCategory.find((category) => category.id === resource.category)?.label ?? "Resource"}</p>
                <h2 className="title-md mt-3 text-foreground">{resource.name}</h2>
              </div>
              {resource.note ? (
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary/90">
                  {resource.note}
                </span>
              ) : null}
            </div>

            <p className="body-sm mt-4">{resource.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {resource.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-foreground/82">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-6">
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm font-medium text-primary transition group-hover:text-primary/90"
              >
                Visit {resource.name}
              </a>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
