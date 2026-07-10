import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        // Android's Digital Asset Links verification requires exactly this
        // path. Serving it via an API route rewrite instead of a static
        // public/ file avoids Vercel's default dotfolder exclusion, which
        // was causing a 404 on the plain static file.
        source: "/.well-known/assetlinks.json",
        destination: "/api/assetlinks",
      },
    ];
  },
};

export default nextConfig;