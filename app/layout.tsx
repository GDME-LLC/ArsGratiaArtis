import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Inter } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PublicExperienceRoot } from "@/components/public/public-experience-root";
import { PUBLIC_HOME_VISITED_STORAGE_KEY, PUBLIC_INTRO_STORAGE_KEY } from "@/lib/constants/site";

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

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.ars-gratia.com").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ArsNeos",
    template: "%s | ArsNeos",
  },
  description:
    "A creator-first home for releasing films, shaping a public presence, and sharing the craft behind the work.",
  openGraph: {
    title: "ArsNeos",
    description: "Cinema belongs to creators again.",
    url: siteUrl,
    siteName: "ArsNeos",
    type: "website",
    images: [
      {
        url: "/brand/ArsNeos-OG_Image.png",
        width: 1200,
        height: 630,
        alt: "ArsNeos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArsNeos",
    description: "Cinema belongs to creators again.",
    images: ["/brand/ArsNeos-OG_Image.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
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
      root.dataset.publicHeroVisible = "true";
      root.dataset.publicShowIntroOverlay = "false";
      return;
    }

    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var navEntries = typeof performance !== "undefined" && performance.getEntriesByType ? performance.getEntriesByType("navigation") : [];
    var isReload = !!(navEntries && navEntries.length && navEntries[0] && navEntries[0].type === "reload");
    var introSeen = false;
    var homeVisited = false;

    try {
      introSeen = window.sessionStorage.getItem("${PUBLIC_INTRO_STORAGE_KEY}") === "true";
      homeVisited = window.sessionStorage.getItem("${PUBLIC_HOME_VISITED_STORAGE_KEY}") === "true";
    } catch (error) {}

    var shouldPlayIntro = !prefersReducedMotion && !introSeen && !isReload && !homeVisited;

    root.dataset.publicEntry = shouldPlayIntro ? "intro" : "ready";
    root.dataset.publicLoopVisible = "true";
    root.dataset.publicContentVisible = shouldPlayIntro ? "false" : "true";
    root.dataset.publicHeroVisible = shouldPlayIntro ? "false" : "true";
    root.dataset.publicShowIntroOverlay = shouldPlayIntro ? "true" : "false";
  } catch (error) {
    var root = document.documentElement;
    root.dataset.publicRoute = "true";
    root.dataset.publicEntry = "ready";
    root.dataset.publicLoopVisible = "true";
    root.dataset.publicContentVisible = "true";
    root.dataset.publicHeroVisible = "true";
    root.dataset.publicShowIntroOverlay = "false";
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
