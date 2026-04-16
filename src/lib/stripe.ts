// src/lib/stripe.ts
// ─── Stripe server-side client ───────────────────────────────────────────────

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === "production") {
  throw new Error("STRIPE_SECRET_KEY is not set in production");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

/** Convert euro cents to euros for display */
export function centsToEuros(cents: number) {
  return cents / 100;
}

/** Convert euro amount to cents for Stripe */
export function eurosToCents(euros: number) {
  return Math.round(euros * 100);
}
