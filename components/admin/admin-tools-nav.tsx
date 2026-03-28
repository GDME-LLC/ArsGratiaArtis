import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AdminToolsNav({ current }: { current?: "overview" | "badges" | "films" }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild variant={current === "badges" ? "default" : "ghost"} size="lg">
        <Link href="/admin/badges">Badges</Link>
      </Button>
      <Button asChild variant={current === "films" ? "default" : "ghost"} size="lg">
        <Link href="/admin/films">Moderation Tools</Link>
      </Button>
      <Button asChild variant="ghost" size="lg">
        <Link href="/dashboard">Return to Creator Dashboard</Link>
      </Button>
    </div>
  );
}
