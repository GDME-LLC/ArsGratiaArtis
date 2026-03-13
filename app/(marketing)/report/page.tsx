import Link from "next/link";

import { ReportForm } from "@/components/report/report-form";
import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { Button } from "@/components/ui/button";

type ReportPageProps = {
  searchParams?: Promise<{
    type?: string;
    slug?: string;
    handle?: string;
  }>;
};

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const type = params?.type === "creator" ? "creator" : "film";
  const targetLabel = type === "creator" ? "Creator profile" : "Film";
  const targetValue =
    type === "creator"
      ? `@${params?.handle ?? "unknown"}`
      : params?.slug
        ? `/film/${params.slug}`
        : "Unknown film";
  const backHref =
    type === "creator" && params?.handle
      ? `/creator/${params.handle}`
      : params?.slug
        ? `/film/${params.slug}`
        : "/feed";

  return (
    <SectionShell className="py-14 sm:py-16">
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="ghost" size="lg">
          <Link href={backHref}>Back</Link>
        </Button>
      </div>

      <div className="mt-6 max-w-2xl">
        <PageIntro
          eyebrow="Report"
          title="Flag something that needs review."
          description="Use this page to document a concern clearly. In this invite-stage build, reports are handled manually and this flow should be treated as an interim review surface."
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <ReportForm targetLabel={targetLabel} targetValue={targetValue} />

        <aside className="surface-panel p-6">
          <p className="display-kicker">Important Note</p>
          <h2 className="title-md mt-3 text-foreground">Placeholder trust surface</h2>
          <p className="body-sm mt-3">
            This page is intentionally honest about being a manual interim flow. Before wider rollout, ArsGratia should add reviewed policies, real intake handling, and logged moderation actions.
          </p>
        </aside>
      </div>
    </SectionShell>
  );
}
