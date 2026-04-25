import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Server-side DSN — prefer non-public env var; fall back to public one
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.1,

  debug: false,

  // Don't capture 4xx errors — those are expected (user errors)
  beforeSend(event) {
    const status = event.tags?.["http.status_code"];
    if (typeof status === "number" && status >= 400 && status < 500) return null;
    return event;
  },
});
