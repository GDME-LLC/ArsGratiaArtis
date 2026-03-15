import Link from "next/link";
import { redirect } from "next/navigation";

import { FoundingCreatorAdminPanel } from "@/components/founding/founding-creator-admin-panel";
import { FoundingCreatorBenefits } from "@/components/founding/founding-creator-benefits";
import { SectionShell } from "@/components/marketing/section-shell";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { getAdminUser } from "@/lib/admin";
import { getFoundingCreatorAdminOverview } from "@/lib/founding-creators";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

export default async function FoundingCreatorsAdminPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <SectionShell className="py-20">
        <StatePanel
          title="Founding creator controls need a live database connection"
          description="The interface can render locally, but founder management requires real auth and profile records."
        />
      </SectionShell>
    );
  }

  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/dashboard");
  }

  try {
    const overview = await getFoundingCreatorAdminOverview();

    return (
      <SectionShell className="py-14 sm:py-16">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="ghost" size="lg">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div>
            <p className="display-kicker">Admin</p>
            <h1 className="headline-xl mt-4">Top 20 Founding Creators</h1>
            <p className="body-lg mt-4 max-w-3xl">
              Assign, revoke, and feature the permanent founding roster. This is the source of truth for the first 20 creators on ArsGratia.
            </p>
          </div>

          <FoundingCreatorBenefits
            title="Founding Tier Positioning"
            description="Keep the founder tier selective, durable, and historically meaningful. Admin assignment remains the source of truth."
          />
        </div>

        <div className="mt-8">
          <FoundingCreatorAdminPanel overview={overview} />
        </div>
      </SectionShell>
    );
  } catch (error) {
    return (
      <SectionShell className="py-20">
        <StatePanel
          title="Founding creator controls could not be loaded"
          description={error instanceof Error ? error.message : "An unexpected error occurred."}
        />
      </SectionShell>
    );
  }
}
