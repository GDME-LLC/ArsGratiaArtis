import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { securityConfig } from "@/lib/constants/security";
import { siteConfig } from "@/lib/constants/site";

type PolicySection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

const sections: PolicySection[] = [
  {
    title: "Overview",
    paragraphs: [
      "ArsNeos respects your privacy and aims to collect only the information necessary to operate the platform.",
      "This Privacy Policy reflects the current invite-stage service and may evolve as the platform, infrastructure, and review process mature.",
    ],
  },
  {
    title: "1. Information We Collect",
    paragraphs: ["When you create an account, we may collect:"],
    bullets: [
      "email address",
      "profile information you provide",
      "content you publish",
      "interactions such as likes, follows, comments, and reports",
    ],
  },
  {
    title: "2. How We Use Information",
    paragraphs: ["Information collected may be used to:"],
    bullets: [
      "operate the ArsNeos platform",
      "display creator profiles and published films",
      "improve platform features",
      "communicate important updates",
      "support trust and safety review",
    ],
  },
  {
    title: "3. Public Information",
    paragraphs: [
      "Content published on ArsNeos, including films, creator profiles, comments, and interactions, may be publicly visible depending on your settings.",
    ],
  },
  {
    title: "4. Platform Infrastructure",
    paragraphs: ["ArsNeos uses third-party services to operate the platform, including:"],
    bullets: [
      "hosting infrastructure",
      "database services",
      "video streaming services",
      "security tools for bot protection, rate limiting, and moderation review",
    ],
  },
  {
    title: "5. Data Retention",
    paragraphs: [
      "We retain account and platform data for as long as necessary to operate the service.",
      "Creators may request account deletion.",
    ],
  },
  {
    title: "6. Security",
    paragraphs: [
      "We take reasonable measures to protect account and platform data, though no online service can guarantee complete security.",
      `Security questions may be directed to ${securityConfig.securityEmail}.`,
    ],
  },
  {
    title: "7. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy as ArsNeos evolves.",
      "Changes will be reflected by updating the Last updated date on this page.",
    ],
  },
  {
    title: "8. Contact",
    paragraphs: [
      "Privacy questions may be directed to:",
      siteConfig.privacyEmail,
      `Security: ${securityConfig.securityEmail}`,
      `DMCA / abuse / takedown: ${securityConfig.dmcaEmail}`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <SectionShell className="py-14 sm:py-16">
      <PageIntro
        eyebrow="Privacy"
        title="Privacy Policy"
        description={`Last updated: ${siteConfig.legalLastUpdated}`}
      />

      <div className="mt-8 grid gap-4">
        {sections.map((section) => (
          <article key={section.title} className="surface-panel p-5 sm:p-6">
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
