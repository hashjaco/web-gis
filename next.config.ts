import type { NextConfig } from "next";

const cspDirectives = [
  "default-src 'self'",
  // Scripts: self + inline for Next.js hydration, eval for maplibre-gl workers
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.clerk.accounts.dev",
  // Styles: self + inline for Tailwind / maplibre
  "style-src 'self' 'unsafe-inline'",
  // Images: self + data URIs + map tile providers
  "img-src 'self' data: blob: https://api.maptiler.com https://*.maptiler.com https://demotiles.maplibre.org https://img.clerk.com",
  // Fonts
  "font-src 'self' data:",
  // Connect: API calls, tile servers, geocoding, routing
  "connect-src 'self' http://127.0.0.1:7897 https://api.maptiler.com https://*.maptiler.com https://demotiles.maplibre.org https://nominatim.openstreetmap.org https://*.clerk.accounts.dev https://*.clerk.dev https://clerk-telemetry.com https://*.liveblocks.io wss://*.liveblocks.io blob:",
  // Workers for maplibre-gl
  "worker-src 'self' blob:",
  // Child/frame for embeds
  "child-src 'self' blob:",
  // Frame ancestors: only self (embed pages handled via X-Frame-Options override)
  "frame-ancestors 'self'",
  // Form actions
  "form-action 'self'",
  // Base URI
  "base-uri 'self'",
];

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(), microphone=(), payment=()",
  },
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/((?!embed).*)",
        headers: securityHeaders,
      },
      {
        source: "/embed/:path*",
        headers: securityHeaders
          .filter((h) => h.key !== "X-Frame-Options")
          .map((h) => {
            if (h.key === "Content-Security-Policy") {
              return {
                ...h,
                value: h.value.replace("frame-ancestors 'self'", "frame-ancestors *"),
              };
            }
            return h;
          }),
      },
    ];
  },
};

export default nextConfig;
