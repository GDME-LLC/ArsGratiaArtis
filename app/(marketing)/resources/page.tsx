import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";

export default function ResourcesPage() {
  return (
    <SectionShell className="py-20">
      <PageIntro
        eyebrow="Resources"
        title="Tools, references, and practical filmcraft."
        description="This placeholder will hold filmmaking resources tied directly to the work and creators publishing on ArsGratia."
      />
    </SectionShell>
  );
}
