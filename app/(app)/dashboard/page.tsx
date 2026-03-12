import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";

export default function DashboardPage() {
  return (
    <SectionShell className="py-20">
      <PageIntro
        eyebrow="Dashboard"
        title="Manage your films, profile, and audience."
        description="This placeholder will become the creator dashboard for uploads, publishing state, analytics, and profile editing."
      />
    </SectionShell>
  );
}
