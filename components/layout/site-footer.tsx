import Link from "next/link";
import { Instagram, Linkedin, Youtube } from "lucide-react";

import { securityConfig } from "@/lib/constants/security";
import { siteConfig } from "@/lib/constants/site";

const footerLinks = [
  { href: "/manifesto", label: "Manifesto" },
  { href: "/feed", label: "New Releases" },
  { href: "/beyond-cinema", label: "Beyond Cinema" },
  { href: "/resources", label: "Resources" },
  { href: "/report", label: "Report Abuse" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

const socialLinks = [
  { href: "https://www.youtube.com", label: "YouTube", Icon: Youtube },
  { href: "https://www.instagram.com", label: "Instagram", Icon: Instagram },
  { href: "https://www.linkedin.com", label: "LinkedIn", Icon: Linkedin },
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
            Releases, creator pages, and selected craft notes for filmmakers publishing on ArsNeos.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Support: {siteConfig.supportEmail}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            DMCA / abuse / takedown: {securityConfig.dmcaEmail}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Copyright 2026 ArsNeos
          </p>
          <div className="mt-4 flex items-center gap-2">
            {socialLinks.map(({ href, label, Icon }) => (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-black/25 text-muted-foreground transition hover:border-white/24 hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
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
