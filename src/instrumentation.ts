import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Wire the Next.js App Router request-error hook to Sentry so nested RSC
// errors are captured (introduced in Next.js 15 / Sentry SDK v8+).
export const onRequestError = Sentry.captureRequestError;
