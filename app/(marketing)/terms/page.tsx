import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";

const sections = [
  {
    title: "Invite-stage notice",
    body:
      "These Terms are placeholder copy for an invite-stage product preview. They should be reviewed by qualified counsel before ArsGratia is opened more broadly or used for commercial release activity.",
  },
  {
    title: "Use of the service",
    body:
      "ArsGratia is intended for publishing films, creator pages, and selected production context. Do not use the service to upload or present work you do not have the right to share.",
  },
  {
    title: "Creator responsibility",
    body:
      "Creators remain responsible for the rights, claims, credits, and supporting materials attached to their work, including posters, video, prompts, notes, and linked assets.",
  },
  {
    title: "Moderation and access",
    body:
      "ArsGratia may remove content, suspend access, or review accounts when safety, rights, or policy concerns arise. This section is intentionally high-level until a fuller moderation policy is reviewed.",
  },
  {
    title: "No final legal review yet",
    body:
      "Nothing on this page should be treated as final legal language. It is here to signal intent and invite trust, not to replace proper legal drafting.",
  },
] as const;

export default function TermsPage() {
  return (
    <SectionShell className="py-14 sm:py-16">
      <PageIntro
        eyebrow="Terms"
        title="Working terms for an invite-stage release."
        description="This page exists to make the current state of ArsGratia legible to invited creators. It is a trust surface, not final legal review."
      />

      <div className="mt-8 grid gap-4">
        {sections.map((section) => (
          <article key={section.title} className="surface-panel p-5 sm:p-6">
            <h2 className="title-md text-foreground">{section.title}</h2>
            <p className="body-sm mt-3">{section.body}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
