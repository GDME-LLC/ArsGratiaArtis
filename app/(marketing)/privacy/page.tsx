import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";

const sections = [
  {
    title: "Invite-stage notice",
    body:
      "This Privacy page is placeholder guidance for invited users. It should be reviewed and replaced with formal policy language before any broader public launch.",
  },
  {
    title: "Account and profile data",
    body:
      "ArsGratia stores account, profile, and film-related information needed to present creator pages, releases, and related engagement features.",
  },
  {
    title: "Uploaded materials",
    body:
      "Creators may store posters, metadata, release notes, prompts, workflow notes, and video-related records needed to present or manage a film page.",
  },
  {
    title: "Public visibility",
    body:
      "Anything a creator marks as public may be visible on public film pages, creator pages, feeds, or related discovery surfaces.",
  },
  {
    title: "No final privacy review yet",
    body:
      "This page is meant to provide clarity now, but it is not a substitute for formal legal and privacy review. A fuller retention, disclosure, and rights policy should be completed before expansion.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <SectionShell className="py-14 sm:py-16">
      <PageIntro
        eyebrow="Privacy"
        title="Working privacy notes for invited creators."
        description="This page explains the current posture of the product in plain language. It is intentionally marked as placeholder guidance pending formal review."
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
