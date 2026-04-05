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
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
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
