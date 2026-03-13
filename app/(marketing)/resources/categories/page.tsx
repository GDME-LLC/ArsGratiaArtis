import Link from "next/link";

import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/constants/resources";

export default function ResourceCategoriesPage() {
  return (
    <SectionShell className="py-14 sm:py-16">
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="ghost" size="lg">
          <Link href="/resources">Back to Resources</Link>
        </Button>
      </div>

      <div className="mt-6 max-w-2xl">
        <PageIntro
          eyebrow="Categories"
          title="Browse tools by the part of the process you are working on."
          description="Jump directly into video, image, audio, editing, or story tools depending on where your project needs help right now."
        />
      </div>

      <div className="mt-8 grid gap-5">
        {categories.map((category) => (
          <section
            key={category.id}
            className="surface-panel p-5 sm:p-6"
          >
            <div className="max-w-3xl">
              <p className="display-kicker">{category.name}</p>
              <h2 className="title-md mt-3 text-foreground">{category.summary}</h2>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {category.items.map((item) => (
                <article
                  key={item.name}
                  className="rounded-[22px] border border-white/10 bg-black/20 p-5"
                >
                  <h3 className="title-md text-foreground">{item.name}</h3>
                  <p className="body-sm mt-3">{item.description}</p>
                  <a
                    href={item.href}
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
