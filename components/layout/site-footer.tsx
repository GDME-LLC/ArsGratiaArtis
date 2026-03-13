import Link from "next/link";

import { siteConfig } from "@/lib/constants/site";

const footerLinks = [
  { href: "/manifesto", label: "Manifesto" },
  { href: "/feed", label: "New Releases" },
  { href: "/resources", label: "Resources" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="container-shell flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold uppercase tracking-[0.22em]">
            {siteConfig.name}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Releases, creator pages, and selected craft notes for invited filmmakers.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            © 2026 ArsGratia
          </p>
        </div>

        <div className="flex flex-wrap gap-5">
          {footerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
