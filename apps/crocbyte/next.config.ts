import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@empire/ui", "@empire/core"],
  poweredByHeader: false,
};

export default nextConfig;
