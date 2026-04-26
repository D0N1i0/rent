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

  // ── Event-level idempotency (DB unique constraint) ───────────────────────
  // Insert a WebhookEvent row FIRST. The (provider, eventId) unique index
  // guarantees at-most-once processing even under concurrent deliveries —
  // racing deliveries that both pass a pre-check would otherwise both run
  // handler logic. If the insert fails with P2002 this delivery is a
  // duplicate and must short-circuit.
  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        status: "PROCESSED",
      },
    });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[Stripe Webhook] Failed to record event:", err);
    return NextResponse.json({ received: false }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const bookingId = intent.metadata?.bookingId;
        if (!bookingId) break;

        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            confirmedAt: true,
          },
        });
        if (!booking) {
          console.warn(`[Stripe Webhook] payment_intent.succeeded: booking ${bookingId} not found`);
          break;
        }

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
          select: { id: true },
        });
        if (!booking) {
          console.warn(`[Stripe Webhook] charge.refunded: no booking for payment_intent ${charge.payment_intent}`);
          break;
        }

        const fullyRefunded = charge.amount_refunded >= charge.amount;

        // Wrap both writes atomically — a partial write (paymentStatus updated
        // but activity log missing) would leave the operator with no audit trail
        // and the anomaly detector firing false positives.
        await prisma.$transaction([
          prisma.booking.update({
            where: { id: booking.id },
            data: { paymentStatus: fullyRefunded ? "REFUNDED" : "PARTIALLY_PAID" },
          }),
          prisma.activityLog.create({
            data: {
              action: fullyRefunded ? "PAYMENT_REFUNDED" : "PAYMENT_PARTIALLY_REFUNDED",
              entity: "Booking",
              entityId: booking.id,
              details: {
                amountRefunded: charge.amount_refunded / 100,
                fullyRefunded,
              },
            },
          }),
        ]);
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
    // Remove the idempotency row atomically so Stripe's retry sees a clean
    // path. We intentionally skip an intermediate FAILED-status update: if
    // we wrote FAILED and then the delete failed (silently), the row would
    // persist and block future retries — causing Stripe to receive
    // `duplicate: true` and stop retrying even though processing never
    // succeeded. A single delete avoids that split-brain.
    await prisma.webhookEvent
      .delete({
        where: { provider_eventId: { provider: "stripe", eventId: event.id } },
      })
      .catch(() => {});

    // Log failure to the activity log so operators can investigate.
    await prisma.activityLog
      .create({
        data: {
          action: "WEBHOOK_PROCESSING_FAILED",
          entity: "WebhookEvent",
          entityId: event.id,
          details: {
            eventType: event.type,
            error: String((err as Error)?.message ?? err).slice(0, 1000),
          },
        },
      })
      .catch(() => {});

    // Return 500 so Stripe retries per its backoff policy.
    return NextResponse.json({ received: false, processingError: true }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
