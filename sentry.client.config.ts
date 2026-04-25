import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 10% of transactions for performance monitoring — adjust in production
  tracesSampleRate: 0.1,

  // Only enable replay in production to keep bundle small in dev
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  debug: false,

  // Strip PII before sending to Sentry
  beforeSend(event) {
    if (event.user) {
      // Keep user ID for grouping but remove identifying info
      event.user = { id: event.user.id };
    }
    return event;
  },
});
