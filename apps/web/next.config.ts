import path from "node:path";
import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const appDirectory = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
  outputFileTracingRoot: path.join(appDirectory, "../.."),
  outputFileTracingIncludes: {
    "/*": ["./src/generated/prisma/**/*"],
  },
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  images: {
    // Restrict the set of generated sizes to reduce Vercel Image Optimization
    // Cache Writes and Transformations. Cloudinary images are served via a
    // custom loader (f_auto,q_auto,w_N) and bypass Vercel optimization entirely.
    // Only the local brand logo (/brand/organza-fashion.png) goes through Vercel
    // optimization – and those usages are marked `unoptimized` in the components
    // so the actual number of Vercel transformations is now negligible.
    deviceSizes: [640, 1080, 1920],
    imageSizes: [48, 96, 256],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000, // 30 days – maximise cache hit rate
  },
  async headers() {
    const securityHeaders = [
      { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ...(process.env.NODE_ENV === "production"
        ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
        : []),
    ];

    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
