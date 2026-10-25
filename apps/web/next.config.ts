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
