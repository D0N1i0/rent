// src/app/api/webhooks/stripe/route.ts
// Stripe webhook handler — receives payment events and updates booking status.
// IMPORTANT: This endpoint must remain un-authenticated (no session check).
//            Stripe signs every request with STRIPE_WEBHOOK_SECRET.
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Event-level idempotency ──────────────────────────────────────────────
  // Stripe may deliver the same event multiple times (retries, network
  // glitches). We persist a marker in ActivityLog the first time we see an
  // event.id, and skip all further deliveries. This protects every handler
  // below — including charge.refunded which does not have a paymentStatus
  // idempotency short-circuit.
  const alreadyProcessed = await prisma.activityLog.findFirst({
    where: { entity: "StripeEvent", entityId: event.id },
    select: { id: true },
  });
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const bookingId = intent.metadata?.bookingId;
        if (!bookingId) break;

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) break;

        // Idempotency: skip if already marked paid
        if (booking.paymentStatus === "PAID") break;

        await prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              paymentStatus: "PAID",
              paymentMethod: "online",
              // Auto-confirm the booking on successful payment
              status: booking.status === "PENDING" ? "CONFIRMED" : booking.status,
              confirmedAt: booking.status === "PENDING" ? new Date() : booking.confirmedAt,
            },
          });

          if (booking.status === "PENDING") {
            await tx.bookingStatusHistory.create({
              data: {
                bookingId,
                fromStatus: "PENDING",
                toStatus: "CONFIRMED",
                reason: "Payment received via Stripe",
              },
            });
          }

          await tx.activityLog.create({
            data: {
              action: "PAYMENT_RECEIVED",
              entity: "Booking",
              entityId: bookingId,
              details: {
                stripePaymentIntentId: intent.id,
                amount: intent.amount / 100,
                currency: intent.currency,
              },
            },
          });
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const bookingId = intent.metadata?.bookingId;
        if (!bookingId) break;

        await prisma.activityLog.create({
          data: {
            action: "PAYMENT_FAILED",
            entity: "Booking",
            entityId: bookingId,
            details: {
              stripePaymentIntentId: intent.id,
              lastError: intent.last_payment_error?.message,
            },
          },
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (!charge.payment_intent) break;

        const booking = await prisma.booking.findFirst({
          where: { stripePaymentIntentId: String(charge.payment_intent) },
        });
        if (!booking) break;

        const fullyRefunded = charge.amount_refunded >= charge.amount;

        await prisma.booking.update({
          where: { id: booking.id },
          data: { paymentStatus: fullyRefunded ? "REFUNDED" : "PARTIALLY_PAID" },
        });

        await prisma.activityLog.create({
          data: {
            action: fullyRefunded ? "PAYMENT_REFUNDED" : "PAYMENT_PARTIALLY_REFUNDED",
            entity: "Booking",
            entityId: booking.id,
            details: {
              amountRefunded: charge.amount_refunded / 100,
              fullyRefunded,
            },
          },
        });
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }

    // Record the event as processed so duplicate deliveries short-circuit.
    await prisma.activityLog.create({
      data: {
        action: "STRIPE_WEBHOOK_PROCESSED",
        entity: "StripeEvent",
        entityId: event.id,
        details: { type: event.type },
      },
    });
  } catch (err) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
    // Record the error for operator visibility, but do NOT mark the event as
    // processed — Stripe will retry and we'll get another chance to succeed.
    await prisma.activityLog
      .create({
        data: {
          action: "STRIPE_WEBHOOK_ERROR",
          entity: "StripeEvent",
          entityId: event.id,
          details: { type: event.type, error: String((err as Error)?.message ?? err) },
        },
      })
      .catch(() => {});
    // Return 500 so Stripe retries per its backoff policy.
    return NextResponse.json({ received: false, processingError: true }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
