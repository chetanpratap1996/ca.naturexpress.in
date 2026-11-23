/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  generateBuildId: async () => {
    return "taxobrain-build-v1";
  },

  // ─── Webpack Customization ────────────────────────────────────────────────
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.output.crossOriginLoading = "anonymous";
      // Allow 5 minutes for chunk loading in both dev and production to prevent timeouts during compilation
      config.output.chunkLoadTimeout = 300000;
    }
    return config;
  },

  // ─── HTTP Headers ─────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // 1. Immutable cache for content-hashed Next.js static assets
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // 2. HTML documents & root navigation: NEVER cache stale HTML!
        //    Ensures clients always receive the fresh HTML document containing
        //    the current CSS and JS chunk hashes, preventing FOUC and Chunk 404s.
        source: "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob: https:; " +
              "font-src 'self' data:; " +
              "connect-src 'self' https: wss:; " +
              "frame-src 'self' https://www.google.com https://maps.google.com; " +
              "frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
