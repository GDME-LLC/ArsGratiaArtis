import { SectionShell } from "@/components/marketing/section-shell";
import { HeroProductPanels } from "@/components/marketing/hero";
import { getDefaultPlatformSettings, getPlatformSettings } from "@/lib/platform-settings";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

const sections = [
  {
    eyebrow: "What ArsNeos Is",
    title: "A platform for films with authorship.",
    body: "ArsNeos is a creator-first home for publishing films, shaping a public presence, and sharing the craft behind the work without flattening it into generic platform furniture. It is built for cinema that carries a point of view and for creators who want their presentation to feel considered from the first frame onward.",
  },
  {
    eyebrow: "Why It Exists",
    title: "Because too much of the internet treats films as interchangeable content.",
    body: "Most platforms optimize for churn, sameness, and constant interruption. ArsNeos exists to make room for something slower and more deliberate: a place where the work leads, where discovery still matters, and where emerging creators can stand beside established ones without having to imitate a system that was never built for them.",
  },
  {
    eyebrow: "Who It Is For",
    title: "For filmmakers, visual storytellers, and new voices with intent.",
    body: "ArsNeos is for directors, editors, animators, cinematographers, prompt-native filmmakers, and interdisciplinary creators who care about storytelling, experimentation, and form. You do not need a large audience or institutional backing to belong here. What matters is seriousness of vision, curiosity, and the desire to make work that feels authored.",
  },
  {
    eyebrow: "Ownership",
    title: "Creators keep ownership of their work.",
    body: "Films, images, prompts, notes, and supporting materials remain the creator's work. ArsNeos is a publishing venue and presentation layer, not a claim over authorship. The platform exists to help creators present and contextualize what they make, not to absorb the identity or rights of the work into the platform itself.",
  },
  {
    eyebrow: "Process",
    title: "Tools and workflows are part of the story, not a gimmick.",
    body: "Prompts, software, references, and workflow notes can deepen a viewer's understanding when they are shared with intent. ArsNeos treats process as optional context: a way for creators to reveal method, experimentation, and craft without reducing the finished film to a tech demo. The work comes first. The supporting tools exist to illuminate it.",
  },
  {
    eyebrow: "Closing Statement",
    title: "Cinema deserves spaces that respect the maker.",
    body: "ArsNeos stands for authorship over sameness, experimentation over formula, and stewardship over extraction. We want the platform to feel open to new creators, rigorous enough for serious work, and memorable enough that a film shown here feels properly seen.",
  },
] as const;

export default async function ManifestoPage() {
  const canLoad = hasSupabaseServerEnv();
  const platformSettings = canLoad ? await getPlatformSettings() : getDefaultPlatformSettings();

  return (
    <SectionShell className="py-14 sm:py-16">
      <p className="eyebrow">Manifesto</p>

      <HeroProductPanels heroContent={platformSettings.heroContent} className="mt-5" />

      <div className="mt-8 max-w-3xl rounded-[24px] border border-white/10 bg-white/5 p-6 sm:p-7">
        <p className="display-kicker">Short Form</p>
        <p className="headline-lg mt-3 text-foreground">
          A premium, creator-first cinema platform for work that wants more than a feed.
        </p>
        <p className="body-lg mt-4">
          ArsNeos exists to give films, creators, and creative process a more intentional public home, without asking artists to surrender ownership or dilute their voice.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.title}
            className="surface-panel p-5 sm:p-6"
          >
            <p className="display-kicker">{section.eyebrow}</p>
            <h2 className="title-md mt-3 text-foreground">{section.title}</h2>
            <p className="body-sm mt-3">{section.body}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
