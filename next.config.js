/** @type {import('next').NextConfig} */

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
      // Next.js RSC and inline styles require unsafe-inline; Stripe.js must load from js.stripe.com
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' js.stripe.com",
      // Stripe Elements iframe
      "frame-src js.stripe.com hooks.stripe.com",
      // API calls: own origin + Stripe + Cloudinary
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

module.exports = nextConfig;
