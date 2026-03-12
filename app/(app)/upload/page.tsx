import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";

export default function UploadPage() {
  return (
    <SectionShell className="py-20">
      <PageIntro
        eyebrow="Upload"
        title="Bring a new film into the platform."
        description="This placeholder will become the Mux-backed upload flow for film files, metadata, and publish settings."
      />
    </SectionShell>
  );
}
