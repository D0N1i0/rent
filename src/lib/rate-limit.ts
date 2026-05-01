// src/lib/rate-limit.ts
// ─── Rate limiter ─────────────────────────────────────────────────────────────
// Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are
// set (production). Falls back to in-memory storage for local development.
// All callers must await — the return type is always a Promise.

import { Redis } from "@upstash/redis";

// ─── Result type (unchanged from previous synchronous API) ───────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix ms
}

// ─── Redis singleton ──────────────────────────────────────────────────────────

let _redis: Redis | null = null;

let _upstashWarned = false;
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!_upstashWarned && process.env.NODE_ENV === "production") {
      // This fires once per cold-start in production. Each Vercel function instance has its
      // own memory — without Redis, an attacker distributing requests across instances bypasses
      // all rate limits entirely. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in
      // Vercel project settings before accepting real traffic.
      console.error(
        "[rate-limit] CRITICAL: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set. " +
        "Rate limiting is using per-instance in-memory fallback which is INEFFECTIVE on " +
        "multi-instance Vercel deployments. Distributed brute-force attacks (login, booking, " +
        "coupon enumeration) cannot be blocked without Redis. " +
        "ACTION REQUIRED: Add Upstash env vars to Vercel project settings immediately."
      );
      _upstashWarned = true;
    }
    return null;
  }
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

// ─── Admin-specific rate limit tiers ─────────────────────────────────────────
// Keyed by admin user ID (falling back to IP) so genuine concurrent admin
// sessions are not counted against each other, and per-user limits apply.

export type AdminRateLimitTier =
  | "write"          // 60 req / 1 min  — general mutations
  | "refund"         // 5  req / 10 min — financial: admin-initiated Stripe refunds
  | "export"         // 10 req / 10 min — CSV exports (heavy DB scan)
  | "media-upload"   // 20 req / 10 min — Cloudinary uploads
  | "manual-booking" // 20 req / 10 min — admin manual booking creation

const ADMIN_TIER_CONFIG: Record<AdminRateLimitTier, { limit: number; windowMs: number }> = {
  "write":          { limit: 60, windowMs: 60_000 },
  "refund":         { limit: 5,  windowMs: 10 * 60_000 },
  "export":         { limit: 10, windowMs: 10 * 60_000 },
  "media-upload":   { limit: 20, windowMs: 10 * 60_000 },
  "manual-booking": { limit: 20, windowMs: 10 * 60_000 },
};

/**
 * Check the admin rate limit. Returns a 429 NextResponse if exceeded, null otherwise.
 * Import NextResponse in the calling route — this helper returns a plain object
 * so it doesn't pull Next.js server deps into this shared module.
 */
export async function checkAdminRateLimit(
  req: Request,
  adminUserId: string | null | undefined,
  tier: AdminRateLimitTier
): Promise<{ limited: true; status: 429; body: { error: string } } | null> {
  const cfg = ADMIN_TIER_CONFIG[tier];
  const key = `admin:${tier}:${adminUserId ?? getClientIp(req)}`;
  const result = await rateLimit(key, cfg.limit, cfg.windowMs);
  if (!result.allowed) {
    const windowSec = cfg.windowMs / 1000;
    const windowLabel = windowSec >= 60 ? `${windowSec / 60} minutes` : `${windowSec} seconds`;
    return {
      limited: true,
      status: 429,
      body: { error: `Too many requests. Maximum ${cfg.limit} per ${windowLabel}. Please wait and try again.` },
    };
  }
  return null;
}
