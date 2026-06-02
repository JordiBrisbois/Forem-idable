import type { NextConfig } from "next";

function getEnabledUmamiOrigin() {
  if (process.env.UMAMI_ENABLED !== "true") {
    return null;
  }

  const rawUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL?.trim();
  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return null;
    if (!url.pathname.endsWith("/script.js")) return null;
    return url.origin;
  } catch {
    return null;
  }
}

const umamiOrigin = getEnabledUmamiOrigin();
const scriptSrc = ["'self'", "'unsafe-inline'"];
const connectSrc = ["'self'", "https://www.odwb.be", "https://www.leforem.be", "https://api.adzuna.com"];

if (umamiOrigin) {
  scriptSrc.push(umamiOrigin);
  connectSrc.push(umamiOrigin);
}

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  `script-src ${scriptSrc.join(" ")}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src ${connectSrc.join(" ")}`,
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspDirectives },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
