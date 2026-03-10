import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Cloudflare R2 public URL
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        // Google profile pictures (OAuth)
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
