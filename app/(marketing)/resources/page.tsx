import { ExternalLink } from "lucide-react";

import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { featuredResources, resourcesByCategory } from "@/lib/constants/resources";

export default function ResourcesPage() {
  return (
    <SectionShell className="py-12 sm:py-16">
      <div className="surface-panel cinema-frame relative overflow-hidden px-5 py-6 sm:px-8 sm:py-10 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(199,166,106,0.12),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(149,52,80,0.1),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_52%)]" />

        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)] lg:items-start lg:gap-8">
          <div className="min-w-0">
            <PageIntro
              eyebrow="Resources"
              title="Explore the tools, platforms, and communities shaping AI cinema."
              description="ArsGratia exists to present creators and their work with care. This page is a curated guide to the broader ecosystem around generative filmmaking: useful tools, educational hubs, communities, showcases, and research references worth knowing."
            />
          </div>

          <aside className="rounded-[24px] border border-white/10 bg-black/20 p-5 sm:p-6">
            <p className="display-kicker">How To Use This Page</p>
            <div className="mt-4 space-y-4 sm:space-y-5">
              <div>
                <p className="title-md text-foreground">Start with the category closest to your current need</p>
                <p className="body-sm mt-2">
                  Some resources are practical tools. Others are places to study the field, find peers, or sharpen your cinematic references.
                </p>
              </div>
              <div>
                <p className="title-md text-foreground">Use ArsGratia for presentation, not production sprawl</p>
                <p className="body-sm mt-2">
                  These platforms support learning and making. ArsGratia stays focused on showcasing creators, films, and the public identity around the work.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="mt-6 surface-panel p-5 sm:p-6">
        <p className="display-kicker">Featured Picks</p>
        <h2 className="headline-lg mt-2.5 text-foreground">A concise starting shortlist</h2>
        <p className="body-lg mt-3.5 max-w-3xl">
          A few widely used platforms and references that creators return to often when exploring AI-native film work.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {featuredResources.map((resource) => (
            <article key={resource.name} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="display-kicker">{resourcesByCategory.find((category) => category.id === resource.category)?.label ?? "Resource"}</p>
                  <h3 className="title-md mt-3 text-foreground">{resource.name}</h3>
                </div>
                {resource.note ? (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-primary/90">
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
              <div className="mt-5">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary/90"
                >
                  Visit {resource.name}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        {resourcesByCategory.map((category) => (
          <section key={category.id} className="surface-panel p-5 sm:p-6">
            <div className="max-w-3xl">
              <p className="display-kicker">{category.label}</p>
              <h2 className="headline-lg mt-2.5 text-foreground">{category.description}</h2>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {category.items.map((resource) => (
                <article key={resource.name} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <div className="flex min-h-[3rem] items-start justify-between gap-3">
                    <h3 className="title-md text-foreground">{resource.name}</h3>
                    {resource.note ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {resource.note}
                      </span>
                    ) : null}
                  </div>
                  <p className="body-sm mt-3 min-h-[4.5rem]">{resource.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {resource.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-foreground/82">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary/90"
                    >
                      Open resource
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SectionShell>
  );
}
