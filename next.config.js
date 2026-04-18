/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevent clickjacking — car rental bookings run in top-level windows only
  { key: "X-Frame-Options", value: "DENY" },
  // Block full-page referrer on cross-origin navigation (login, payment, admin)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable FLOC/interest-based tracking
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // Force HTTPS for 1 year once loaded (set by CDN in prod — included here as a belt)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    // Allow local /uploads for dev
    unoptimized: process.env.NODE_ENV === "development",
  },
  serverExternalPackages: ["bcryptjs", "nodemailer"],
  // Strict mode for better development experience
  reactStrictMode: true,
  // Prevent accidental exposure of server env vars
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
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
