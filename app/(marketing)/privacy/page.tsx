import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";

type PolicySection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

const sections: PolicySection[] = [
  {
    title: "ArsGratia respects your privacy and aims to collect only the information necessary to operate the platform.",
    paragraphs: ["This Privacy Policy may evolve as ArsGratia grows."],
  },
  {
    title: "1. Information We Collect",
    paragraphs: ["When you create an account, we may collect:"],
    bullets: [
      "email address",
      "profile information you provide",
      "content you publish",
      "interactions such as likes, follows, and comments",
    ],
  },
  {
    title: "2. How We Use Information",
    paragraphs: ["Information collected may be used to:"],
    bullets: [
      "operate the ArsGratia platform",
      "display creator profiles and published films",
      "improve platform features",
      "communicate important updates",
    ],
  },
  {
    title: "3. Public Information",
    paragraphs: [
      "Content published on ArsGratia — including films, creator profiles, comments, and interactions — may be publicly visible depending on your settings.",
    ],
  },
  {
    title: "4. Platform Infrastructure",
    paragraphs: ["ArsGratia uses third-party services to operate the platform, including:"],
    bullets: [
      "hosting infrastructure",
      "database services",
      "video streaming services",
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
    ],
  },
  {
    title: "7. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy as ArsGratia evolves.",
      "Changes will be reflected by updating the \"Last updated\" date.",
    ],
  },
  {
    title: "8. Contact",
    paragraphs: [
      "Privacy questions may be directed to:",
      "privacy@arsgratia.example",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <SectionShell className="py-14 sm:py-16">
      <PageIntro
        eyebrow="Privacy"
        title="Privacy Policy"
        description="Last updated: March 2026"
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
