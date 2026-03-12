import { Hero } from "@/components/marketing/hero";
import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";

const featuredRows = [
  {
    title: "New voices, no permission slip",
    description:
      "Discover emerging filmmakers building worlds outside the studio mold.",
  },
  {
    title: "Creator tools with a point of view",
    description:
      "Find resources, workflows, and filmcraft references built for modern independent cinema.",
  },
  {
    title: "A living archive of bold work",
    description:
      "Watch, follow, and revisit films that feel authored rather than optimized.",
  },
];

export default function HomePage() {
  return (
    <div className="pb-24">
      <Hero />

      <SectionShell className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <PageIntro
          eyebrow="Featured"
          title="An indie cinema home for creators who refuse generic."
          description="ArsGratia is a premium creator-first platform for films, profiles, and filmmaking resources. The interface is dark, deliberate, and built to keep the work in focus."
        />

        <div className="grid gap-4">
          {featuredRows.map((item) => (
            <article key={item.title} className="surface-panel p-6">
              <h3 className="text-2xl font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}
