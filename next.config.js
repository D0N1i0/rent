/** @type {import('next').NextConfig} */
const { withSentryConfig } = require("@sentry/nextjs");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline': required by Next.js App Router for inline script bootstrapping (RSC payloads).
      // 'unsafe-eval':  required by Webpack 5 chunk loader (new Function()) and Sentry tracing
      //                 (stack-frame parsing). Cannot be removed until:
      //                 (a) Next.js ships stable nonce-based CSP support for App Router, AND
      //                 (b) @sentry/nextjs drops its new Function() usage in the browser SDK.
      //                 Track: https://github.com/vercel/next.js/issues/42454
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' js.stripe.com",
      // Stripe Elements iframe
      "frame-src js.stripe.com hooks.stripe.com",
      // API calls: own origin + Stripe + Cloudinary.
      // Sentry errors are tunnelled through /monitoring (same origin) so *.ingest.sentry.io is not needed.
      "connect-src 'self' api.stripe.com res.cloudinary.com",
      // Images: own origin + Cloudinary CDN + Unsplash (seed images)
      "img-src 'self' data: blob: res.cloudinary.com images.unsplash.com",
      // Fonts: Google Fonts
      "font-src 'self' fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
  serverExternalPackages: ["bcryptjs", "nodemailer", "cloudinary"],
  reactStrictMode: true,
  serverRuntimeConfig: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
  },
  publicRuntimeConfig: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Source map upload — only active when SENTRY_AUTH_TOKEN is set (CI/Vercel)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppress Sentry CLI output in non-CI builds
  silent: !process.env.CI,

  // Don't expose source maps in browser bundles
  hideSourceMaps: true,

  // Tunnel Sentry errors through /monitoring so they aren't blocked by ad blockers
  // and so we don't need to add *.ingest.sentry.io to our CSP.
  tunnelRoute: "/monitoring",

  webpack: {
    // Remove Sentry logger debug statements from the bundle (replaces deprecated disableLogger)
    treeshake: { removeDebugLogging: true },
    // We're not using Vercel Cron Monitoring (replaces deprecated automaticVercelMonitors)
    automaticVercelMonitors: false,
  },
});
