import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "runway-static-assets.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "11labs-nonprd-15f22c1d.s3.eu-west-3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.runwayml.com",
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Phase 1: workflow asset sub-routes
        {
          source: "/api/workflows/:id/assets/:assetId",
          destination: "/api/workflows/:id?_sub=assets&_assetId=:assetId",
        },
        {
          source: "/api/workflows/:id/assets",
          destination: "/api/workflows/:id?_sub=assets",
        },
        {
          source: "/api/uploads/workflow-asset",
          destination: "/api/uploads/image?_sub=workflow-asset",
        },
        // Phase 2: integration management (profile route)
        {
          source: "/api/integrations/connect",
          destination: "/api/profile?_sub=integration-connect",
        },
        {
          source: "/api/integrations/:platform",
          destination: "/api/profile?_sub=integration-disconnect&platform=:platform",
        },
        {
          source: "/api/integrations",
          destination: "/api/profile?_sub=integrations",
        },
        // Phase 2: platform asset fetching (workflows route)
        {
          source: "/api/integrations/runway/assets",
          destination: "/api/workflows?_sub=runway-assets",
        },
        {
          source: "/api/integrations/elevenlabs/assets",
          destination: "/api/workflows?_sub=elevenlabs-assets",
        },
        {
          source: "/api/integrations/import",
          destination: "/api/workflows?_sub=integration-import",
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
