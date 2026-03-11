import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

export default withSentryConfig(nextConfig, {
  // Silent source map uploads in CI/CD
  silent: true,
  // Source maps: only upload in production
  sourcemaps: {
    disable: process.env.NODE_ENV !== "production",
  },
});


