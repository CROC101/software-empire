import type { NextConfig } from "next";

// static export: security headers live in public/_headers (Cloudflare static assets read it)
const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["@empire/ui", "@empire/core"],
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
