import { securityConfig } from "@/lib/constants/security";

export const PUBLIC_INTRO_STORAGE_KEY = "arsgratia-public-intro-seen-v4";
export const PUBLIC_HOME_VISITED_STORAGE_KEY = "arsgratia-home-visited-v1";
export const HOME_HERO_LOOP_SRC = "/video/hero-loop-chrome.mp4";
export const HOME_HERO_LOOP_POSTER_SRC = "/video/hero-loop-poster.jpg";
export const HOME_INTRO_VIDEO_SRC = "/brand/firefly-opening.mp4";

export const siteConfig = {
  name: "ArsNeos",
  motto: "ARS GRATIA ARTIS",
  description:
    "A creator-first home for releasing films, shaping a public presence, and sharing the craft behind the work.",
  heroTitle: "Cinema belongs to creators again.",
  heroDescription:
    "ArsNeos is a home for AI filmmakers publishing authored work with releases, process, and presence attached.",
  supportEmail: securityConfig.supportEmail,
  contactEmail: "contact@ArsNeos.com",
  privacyEmail: "privacy@ArsNeos.art",
  legalLastUpdated: securityConfig.legalLastUpdated,
} as const;
