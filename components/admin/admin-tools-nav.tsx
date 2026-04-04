import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AdminToolsNav({ current }: { current?: "overview" | "badges" | "films" | "users" }) {
  return (
    <div className="grid gap-3 sm:flex sm:flex-wrap">
      <Button asChild variant={current === "badges" ? "default" : "ghost"} size="lg" className="w-full sm:w-auto">
        <Link href="/admin/badges">Badges</Link>
      </Button>
      <Button asChild variant={current === "films" ? "default" : "ghost"} size="lg" className="w-full sm:w-auto">
        <Link href="/admin/films">Moderation Tools</Link>
      </Button>
      <Button asChild variant={current === "users" ? "default" : "ghost"} size="lg" className="w-full sm:w-auto">
        <Link href="/admin/users">Users</Link>
      </Button>
      <Button asChild variant="ghost" size="lg" className="w-full px-4 text-[0.78rem] sm:w-auto sm:px-6 sm:text-sm">
        <Link href="/dashboard">Return to Creator Dashboard</Link>
      </Button>
    </div>
  );
}
