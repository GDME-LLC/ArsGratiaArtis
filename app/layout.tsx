import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Inter } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PublicExperienceRoot } from "@/components/public/public-experience-root";

import "./globals.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://arsgratia.com").replace(/\/$/, "");
const PUBLIC_INTRO_STORAGE_KEY = "arsgratia-public-intro-seen-v4";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ArsGratia",
    template: "%s | ArsGratia",
  },
  description:
    "A creator-first home for releasing films, shaping a public presence, and sharing the craft behind the work.",
  openGraph: {
    title: "ArsGratia",
    description: "Cinema belongs to creators again.",
    url: siteUrl,
    siteName: "ArsGratia",
    type: "website",
    images: [
      {
        url: "/brand/arsgratia-og.png",
        width: 1200,
        height: 630,
        alt: "ArsGratia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArsGratia",
    description: "Cinema belongs to creators again.",
    images: ["/brand/arsgratia-og.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
  },
};

const publicEntryBootstrap = `
(function () {
  try {
    var pathname = window.location.pathname || "/";
    var isHome = pathname === "/";
    var root = document.documentElement;
    var isMobile = window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
    root.dataset.platform = isMobile ? "mobile" : "desktop";
    root.dataset.publicRoute = isHome ? "true" : "false";

    if (!isHome) {
      root.dataset.publicEntry = "ready";
      root.dataset.publicLoopVisible = "true";
      root.dataset.publicContentVisible = "true";
      return;
    }

    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var introSeen = false;
    try {
      introSeen = window.sessionStorage.getItem("${PUBLIC_INTRO_STORAGE_KEY}") === "true";
    } catch (error) {}

    if (!prefersReducedMotion && !introSeen) {
      root.dataset.publicEntry = "intro";
      root.dataset.publicLoopVisible = "false";
      root.dataset.publicContentVisible = "false";
      return;
    }

    root.dataset.publicEntry = "ready";
    root.dataset.publicLoopVisible = "true";
    root.dataset.publicContentVisible = "true";
  } catch (error) {
    var root = document.documentElement;
    root.dataset.publicEntry = "ready";
    root.dataset.publicLoopVisible = "true";
    root.dataset.publicContentVisible = "true";
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} bg-background text-foreground antialiased`}
      >
        <Script id="public-entry-bootstrap" strategy="beforeInteractive">
          {publicEntryBootstrap}
        </Script>
        <div className="relative min-h-screen overflow-x-clip bg-[linear-gradient(180deg,#07070b_0%,#0a0a10_44%,#050507_100%)]">
          <PublicExperienceRoot>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </PublicExperienceRoot>
        </div>
      </body>
    </html>
  );
}
