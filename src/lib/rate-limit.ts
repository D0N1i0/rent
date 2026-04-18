// src/lib/rate-limit.ts
// ─── In-process rate limiter ──────────────────────────────────────────────────
// Lightweight sliding-window rate limiter using in-memory storage.
// Works per-instance; if you run multiple server replicas, use Redis instead.
// Sufficient for single-instance deployments (VPS, Railway, Render, etc.)

interface RateWindow {
  count: number;
  resetAt: number; // unix ms
}

const store = new Map<string, RateWindow>();

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store.entries()) {
    if (win.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check and increment rate limit for a given key.
 *
 * @param key       Unique key, e.g. `forgot-password:1.2.3.4`
 * @param limit     Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 * @returns `{ allowed: boolean; remaining: number; resetAt: number }`
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const win = store.get(key);

  if (!win || win.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (win.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: win.resetAt };
  }

  win.count += 1;
  return { allowed: true, remaining: limit - win.count, resetAt: win.resetAt };
}

/** Extract the caller IP from a Next.js Request, falling back to "unknown". */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Build a standard 429 Too Many Requests response with a `Retry-After` header.
 * Pass the `resetAt` unix-ms timestamp returned by `rateLimit()`.
 */
export function tooManyRequests(
  message: string,
  resetAt: number
): Response {
  const retryAfterSecs = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSecs),
    },
  });
}
