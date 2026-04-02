import { securityConfig } from "@/lib/constants/security";

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