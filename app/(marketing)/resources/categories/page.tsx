import Link from "next/link";

import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { resourcesByCategory } from "@/lib/constants/resources";

export default function ResourceCategoriesPage() {
  return (
    <SectionShell className="py-14 sm:py-16">
      <div className="flex flex-wrap gap-3">
        <Link href="/resources" className="inline-flex min-h-11 items-center rounded-2xl border border-white/10 px-5 text-sm text-foreground transition hover:bg-white/[0.05]">
          Back to Resources
        </Link>
      </div>

      <div className="mt-6 max-w-2xl">
        <PageIntro
          eyebrow="Categories"
          title="Browse the ecosystem by craft, medium, and context."
          description="Move directly into the tools, learning platforms, communities, and references most relevant to where your current work needs support."
        />
      </div>

      <div className="mt-8 grid gap-5">
        {resourcesByCategory.map((category) => (
          <section key={category.id} className="surface-panel p-5 sm:p-6">
            <div className="max-w-3xl">
              <p className="display-kicker">{category.label}</p>
              <h2 className="title-md mt-3 text-foreground">{category.description}</h2>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {category.items.map((item) => (
                <article key={item.name} className="rounded-[22px] border border-white/10 bg-black/20 p-5">
                  <h3 className="title-md text-foreground">{item.name}</h3>
                  <p className="body-sm mt-3">{item.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-foreground/82">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center text-sm font-medium text-primary"
                  >
                    Visit {item.name}
                  </a>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SectionShell>
  );
}
