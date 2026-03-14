import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { siteConfig } from "@/lib/constants/site";

type PolicySection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

const sections: PolicySection[] = [
  {
    title: "Welcome to ArsGratia.",
    paragraphs: [
      "ArsGratia is a platform for publishing and discovering independent films created with emerging tools and creative workflows. By accessing or using ArsGratia, you agree to these Terms.",
      "These Terms are a baseline for the current invite-stage platform and may evolve as the service, moderation tooling, and creator program grow.",
    ],
  },
  {
    title: "1. Using ArsGratia",
    paragraphs: ["You may use ArsGratia to:"],
    bullets: [
      "publish original films",
      "share creative workflows and tools",
      "discover and interact with work by other creators",
    ],
  },
  {
    title: "2. Creator Ownership and License",
    paragraphs: [
      "Creators retain ownership of the films, artwork, text, and related materials they publish on ArsGratia.",
      "By publishing content on ArsGratia, a creator grants ArsGratia a non-exclusive, revocable license to host, display, stream, reproduce, and promote that content only as necessary to operate, improve, and promote the platform and the creator's work within it.",
      "ArsGratia does not claim ownership of creator works.",
      "This license does not transfer ownership and does not prevent creators from publishing, licensing, selling, or exhibiting their work elsewhere unless they explicitly choose otherwise through a separate written agreement.",
    ],
  },
  {
    title: "3. Content Responsibility",
    paragraphs: [
      "Creators are responsible for the content they publish.",
      "You agree not to upload material that:",
    ],
    bullets: [
      "infringes copyright or intellectual property rights",
      "contains unlawful, abusive, or harmful material",
      "violates the rights of others",
    ],
  },
  {
    title: "4. Accounts",
    paragraphs: [
      "You are responsible for maintaining the security of your account.",
      "ArsGratia may suspend or terminate accounts that abuse the platform or violate these Terms.",
      "Account creation may be open while creator publishing access is enabled in smaller groups. That access model may change as the platform grows.",
    ],
  },
  {
    title: "5. Platform Availability",
    paragraphs: [
      "ArsGratia is an evolving platform. Features and services may change over time.",
      "We may modify or discontinue parts of the service as the platform develops.",
    ],
  },
  {
    title: "6. Limitation of Liability",
    paragraphs: [
      "ArsGratia is provided \"as is\" without warranties of any kind.",
      "To the extent permitted by law, ArsGratia is not liable for indirect or consequential damages arising from use of the platform.",
    ],
  },
  {
    title: "7. Changes to These Terms",
    paragraphs: [
      "These Terms may be updated as ArsGratia grows.",
      "If material changes are made, the Last updated date on this page should be revised so creators can track the current baseline.",
    ],
  },
  {
    title: "8. Contact",
    paragraphs: [
      "Questions about these Terms may be directed to:",
      siteConfig.contactEmail,
      "This address should route to a monitored inbox before broader public launch.",
    ],
  },
];

export default function TermsPage() {
  return (
    <SectionShell className="py-14 sm:py-16">
      <PageIntro
        eyebrow="Terms"
        title="Terms of Service"
        description={`Last updated: ${siteConfig.legalLastUpdated}`}
      />

      <div className="mt-8 grid gap-4">
        {sections.map((section) => (
          <article
            key={section.title}
            className={`surface-panel p-5 sm:p-6${
              section.title === "2. Creator Ownership and License" ? " cinema-frame" : ""
            }`}
          >
            <h2 className="title-md text-foreground">{section.title}</h2>

            {section.paragraphs ? (
              <div className="mt-3 space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="body-sm">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}

            {section.bullets ? (
              <ul className="mt-3 space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
