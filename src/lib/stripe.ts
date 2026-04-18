// src/lib/stripe.ts
// ─── Stripe server-side client ───────────────────────────────────────────────

import Stripe from "stripe";

// ─── Lazy client ─────────────────────────────────────────────────────────────
// Do NOT throw at module-load: Next.js collects page/route data during build
// and would fail any deployment without live secrets. Instead the client is
// constructed lazily on first use; runtime request handlers surface a clean
// 500 if the key is missing rather than crashing the whole build.
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("STRIPE_SECRET_KEY is not set in production");
    }
    _stripe = new Stripe("sk_test_placeholder", { apiVersion: "2026-03-25.dahlia", typescript: true });
    return _stripe;
  }
  _stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia", typescript: true });
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_t, prop) {
    return Reflect.get(getStripe(), prop, getStripe());
  },
});

/** Convert euro cents to euros for display */
export function centsToEuros(cents: number) {
  return cents / 100;
}

/** Convert euro amount to cents for Stripe */
export function eurosToCents(euros: number) {
  return Math.round(euros * 100);
}
