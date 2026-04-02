import Image from "next/image";
import { ExternalLink } from "lucide-react";

import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { resourcesByCategory, type ResourceCategoryId } from "@/lib/constants/resources";

function normalizeResourceKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ResourceGroup = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  categories: ResourceCategoryId[];
};

const resourceGroups: ResourceGroup[] = [
  {
    id: "tools",
    eyebrow: "Tools",
    title: "Production tools worth knowing",
    description:
      "A concise set of widely used platforms for moving image generation, look development, sound, and post production.",
    imageSrc: "/video/hero-loop-poster.jpg",
    imageAlt: "ArsNeos cinematic hero still",
    categories: ["video_generation", "image_tools", "audio_voice_music", "editing_post"],
  },
  {
    id: "education",
    eyebrow: "Education",
    title: "Learning and research",
    description:
      "Courses, editorial references, and research hubs that help creators sharpen both craft and taste.",
    imageSrc: "/icon.png",
    imageAlt: "ArsNeos editorial brand image",
    categories: ["learning_platforms", "inspiration_research"],
  },
  {
    id: "community",
    eyebrow: "Community",
    title: "Communities and showcases",
    description:
      "Places to meet the field as it is forming, see standout work, and stay close to the culture around AI cinema.",
    imageSrc: "/icon.png",
    imageAlt: "ArsNeos logo mark",
    categories: ["communities_showcases"],
  },
];

const categoryMap = new Map(resourcesByCategory.map((category) => [category.id, category]));

export default function ResourcesPage() {
  return (
    <SectionShell className="py-12 sm:py-16">
      <div className="surface-panel cinema-frame relative overflow-hidden px-5 py-6 sm:px-8 sm:py-10 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,238,248,0.1),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(158,166,178,0.08),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_52%)]" />

        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)] lg:items-start lg:gap-8">
          <div className="min-w-0">
            <PageIntro
              eyebrow="Resources"
              title="Explore the tools, platforms, and communities shaping AI cinema."
              description="ArsNeos highlights creators and finished work. Resources is a shorter editorial guide to the surrounding ecosystem: useful tools, educational platforms, communities, showcases, and research references worth keeping close."
            />
          </div>

          <aside className="rounded-[24px] border border-white/10 bg-black/20 p-5 sm:p-6">
            <p className="display-kicker">Quick Sections</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {resourceGroups.map((group) => (
                <a
                  key={group.id}
                  href={`#${group.id}`}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] text-foreground/84 transition hover:border-primary/35 hover:text-foreground"
                >
                  {group.eyebrow}
                </a>
              ))}
            </div>
            <p className="body-sm mt-4">
              Start with the section closest to what you need right now. ArsNeos remains focused on presentation; these links point outward to the broader ecosystem around making and studying the work.
            </p>
          </aside>
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        {resourceGroups.map((group) => {
          const categories = group.categories
            .map((categoryId) => categoryMap.get(categoryId))
            .filter((category): category is NonNullable<typeof category> => Boolean(category));

          return (
            <section key={group.id} id={group.id} className="surface-panel overflow-hidden p-5 sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] lg:items-start">
                <div className="min-w-0">
                  <p className="display-kicker">{group.eyebrow}</p>
                  <h2 className="headline-lg mt-2.5 text-foreground">{group.title}</h2>
                  <p className="body-lg mt-3.5 max-w-3xl">{group.description}</p>

                  {group.id === "tools" ? (
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      {categories.map((category) => (
                        <a
                          key={category.id}
                          href={`#resource-${category.id}`}
                          className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] text-foreground/84 transition hover:border-primary/35 hover:text-foreground"
                        >
                          {category.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="relative min-h-[180px] overflow-hidden rounded-[24px] border border-white/10 bg-black/30">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-45"
                    style={{ backgroundImage: `url(${group.imageSrc})` }}
                  />
                  {group.id === "community" ? (
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <div
                        className="h-full w-full bg-contain bg-center bg-no-repeat opacity-80"
                        style={{ backgroundImage: `url(${group.imageSrc})` }}
                      />
                    </div>
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,14,0.2),rgba(10,10,14,0.82))]" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="display-kicker">Curated Focus</p>
                    <p className="mt-2 text-sm text-foreground/82">
                      {group.id === "tools"
                        ? "A tighter shortlist of platforms creators actually return to often."
                        : group.id === "education"
                          ? "For sharpening references, language, and critical judgment."
                          : "For staying close to the culture, events, and public conversation."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {categories.map((category) => (
                  <article key={category.id} id={`resource-${category.id}`} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                    <div className="min-w-0">
                      <p className="display-kicker">{category.label}</p>
                      <p className="body-sm mt-2 max-w-2xl">{category.description}</p>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {category.items.slice(0, group.id === "tools" ? 3 : 4).map((resource) => (
                        <div key={resource.name} id={`resource-entry-${normalizeResourceKey(resource.name)}`} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              {resource.logoUrl ? (
                                <div className="mb-3 h-5 max-w-[140px]">
                                  <Image
                                    src={resource.logoUrl}
                                    alt={resource.logoAlt ?? resource.name}
                                    width={140}
                                    height={20}
                                    className="h-full w-auto object-contain opacity-90"
                                  />
                                </div>
                              ) : null}
                              <h3 className="title-md text-foreground">{resource.name}</h3>
                              <p className="body-sm mt-2">{resource.description}</p>
                            </div>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary transition hover:text-primary/90"
                              aria-label={`Open ${resource.name}`}
                            >
                              <span className="hidden sm:inline">Open</span>
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {resource.tags.map((tag) => (
                              <span key={tag} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-foreground/78">
                                {tag}
                              </span>
                            ))}
                            {resource.note ? (
                              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-primary/90">
                                {resource.note}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </SectionShell>
  );
}
