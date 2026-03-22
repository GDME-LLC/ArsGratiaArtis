import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminToolsNav } from "@/components/admin/admin-tools-nav";
import { SectionShell } from "@/components/marketing/section-shell";
import { StatePanel } from "@/components/shared/state-panel";
import { getAdminUser } from "@/lib/admin";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

const toolGroups = [
  {
    label: "Badge Management",
    title: "Curated creator distinctions",
    description:
      "Create badge definitions, protect system badges like Founding Creator, and assign distinctions cleanly across creator identity surfaces.",
    href: "/admin/badges",
    cta: "Open Badge Controls",
  },
  {
    label: "Moderation Tools",
    title: "Film review and visibility controls",
    description:
      "Review recent releases, check moderation state, and quickly hide or unpublish work when platform quality or safety needs attention.",
    href: "/admin/films",
    cta: "Open Moderation Tools",
  },
  {
    label: "Platform Operations",
    title: "Admin access and manual oversight",
    description:
      "Keep the platform human-scaled with manual review, curated creator distinctions, and a clear path for additional admin tools as moderation expands.",
    href: "/admin/films",
    cta: "Review Platform Controls",
  },
];

export default async function AdminDashboardPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <SectionShell className="py-20">
        <StatePanel
          title="Admin tools need a live database connection"
          description="The admin shell can render locally, but badge management and moderation controls require real auth and live platform data."
        />
      </SectionShell>
    );
  }

  const adminUser = await getAdminUser();
  if (!adminUser) {
    redirect("/dashboard");
  }

  return (
    <SectionShell className="py-14 sm:py-16">
      <AdminToolsNav current="overview" />

      <div className="mt-6 max-w-3xl">
        <p className="display-kicker">Admin Tools</p>
        <h1 className="headline-xl mt-4">Platform management</h1>
        <p className="body-lg mt-4">
          A restrained operations hub for the surfaces that shape creator identity, public visibility, and platform trust.
        </p>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-3">
        {toolGroups.map((group) => (
          <Link
            key={group.title}
            href={group.href}
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.06] sm:p-6"
          >
            <p className="display-kicker">{group.label}</p>
            <h2 className="headline-lg mt-3 text-foreground">{group.title}</h2>
            <p className="body-sm mt-3 text-muted-foreground">{group.description}</p>
            <p className="mt-5 text-sm uppercase tracking-[0.18em] text-primary/85">{group.cta}</p>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}
