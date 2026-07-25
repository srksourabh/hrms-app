import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SUPABASE_HOST = "https://iefwhxxhrycaalhxkfgp.supabase.co";
const devScriptSource = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${devScriptSource}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${SUPABASE_HOST}`,
  "font-src 'self' https://frontend-cdn.perplexity.ai",
  `connect-src 'self' ${SUPABASE_HOST}`,
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "0" },
  { key: "Permissions-Policy", value: "camera=(), microphone=()" },
];

const nextConfig: NextConfig = {
  transpilePackages: [
    "@hrms-app/ui",
    "@hrms-app/db",
    "@hrms-app/auth",
    "@hrms-app/config",
  ],
  experimental: {
    optimizePackageImports: ["@hrms-app/ui", "lucide-react"],
  },
  turbopack: {
    root: repoRoot,
  },
  compress: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
