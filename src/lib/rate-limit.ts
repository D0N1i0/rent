// src/lib/rate-limit.ts
// ─── Rate limiter ─────────────────────────────────────────────────────────────
// Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are
// set (production). Falls back to in-memory storage for local development.
// All callers must await — the return type is always a Promise.

// Use the fetch-based entry point so this module works in both Node.js and
// the Edge Runtime (middleware bundles auth.ts → rate-limit.ts).
import { Redis } from "@upstash/redis/cloudflare";

// ─── Result type (unchanged from previous synchronous API) ───────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix ms
}

// ─── Redis singleton ──────────────────────────────────────────────────────────

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!_redis) {
    _redis = new Redis({ url, token });
  }
  return _redis;
}

// ─── Redis-backed implementation ──────────────────────────────────────────────
// Uses INCR + PEXPIRE (set TTL only on the first increment so subsequent
// requests in the same window don't reset the expiry).

async function rateLimitRedis(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redis = getRedis()!;
  const redisKey = `rl:${key}`;

  // Atomic increment — returns the new value
  const count = await redis.incr(redisKey);

  // Only set the TTL on the first request so it expires at the window end
  if (count === 1) {
    await redis.pexpire(redisKey, windowMs);
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: Date.now() + windowMs, // approximate — accurate on first request
  };
}

// ─── In-memory fallback (development / no Redis env vars) ────────────────────

interface RateWindow {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateWindow>();

// Prune expired entries every 5 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [k, w] of store.entries()) {
    if (w.resetAt < now) store.delete(k);
  }
}, 5 * 60 * 1000).unref?.(); // .unref() so it doesn't block process exit

function rateLimitMemory(key: string, limit: number, windowMs: number): RateLimitResult {
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

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check and increment the rate limit for a key.
 * Uses Upstash Redis if configured; falls back to in-memory.
 *
 * @param key       Unique key, e.g. `forgot-password:1.2.3.4`
 * @param limit     Max requests allowed in the window
 * @param windowMs  Window size in milliseconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const redis = getRedis();
    if (redis) return await rateLimitRedis(key, limit, windowMs);
  } catch (err) {
    // Redis error — fall through to in-memory so the API keeps working
    console.error("[RateLimit] Redis error, falling back to in-memory:", err);
  }
  return rateLimitMemory(key, limit, windowMs);
}

/** Extract the caller IP from a Next.js Request, falling back to "unknown". */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
