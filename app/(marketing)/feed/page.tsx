import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";

export default function FeedPage() {
  return (
    <SectionShell className="py-20">
      <PageIntro
        eyebrow="Feed"
        title="Browse featured work and creator updates."
        description="This placeholder will become the public discovery feed for films, creators, and featured collections."
      />
    </SectionShell>
  );
}
