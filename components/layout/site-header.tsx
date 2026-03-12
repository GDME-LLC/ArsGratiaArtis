import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/constants/site";

const navItems = [
  { href: "/manifesto", label: "Manifesto" },
  { href: "/feed", label: "Feed" },
  { href: "/resources", label: "Resources" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="container-shell flex min-h-20 items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="group">
            <div className="text-lg font-semibold tracking-[0.22em] text-foreground uppercase">
              {siteConfig.name}
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition group-hover:text-primary/80">
              {siteConfig.motto}
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Become a Creator</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
