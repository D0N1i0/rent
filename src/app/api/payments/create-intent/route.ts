// src/app/api/payments/create-intent/route.ts
// Creates (or retrieves existing) Stripe PaymentIntent for a booking.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { stripe, eurosToCents } from "@/lib/stripe";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({ bookingId: z.string().min(1) });

export async function POST(req: NextRequest) {
  // Rate limit: 10 per hour per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`payment-intent:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many payment attempts." }, { status: 429 });
  }

  const session = await auth();

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const { bookingId } = parsed.data;

    // Load booking — allow both authenticated owners and guest bookings (by id)
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { car: { select: { name: true } }, pickupLocation: { select: { name: true } } },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Ownership check: logged-in user must own it, or it must be a guest booking (no userId)
    if (session?.user && booking.userId && booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only allow payment for PENDING/CONFIRMED + UNPAID
    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return NextResponse.json({ error: `Cannot pay for booking with status: ${booking.status}` }, { status: 400 });
    }
    if (booking.paymentStatus === "PAID") {
      return NextResponse.json({ error: "This booking is already paid" }, { status: 400 });
    }

    // Re-use existing intent if already created
    if (booking.stripePaymentIntentId && booking.stripeClientSecret) {
      // Verify the intent is still valid
      try {
        const existing = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);
        if (existing.status === "requires_payment_method" || existing.status === "requires_confirmation") {
          return NextResponse.json({ clientSecret: booking.stripeClientSecret });
        }
        if (existing.status === "succeeded") {
          // Missed-webhook recovery: bring booking state fully in sync with
          // Stripe — same logic the webhook handler runs on payment_intent.succeeded.
          // paymentStatus !== "PAID" is guaranteed here: the guard above returns
          // early if already PAID.
          await prisma.$transaction(async (tx) => {
              await tx.booking.update({
                where: { id: bookingId },
                data: {
                  paymentStatus: "PAID",
                  paymentMethod: "online",
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
                    reason: "Payment confirmed — missed webhook recovery",
                  },
                });
              }
              await tx.activityLog.create({
                data: {
                  action: "PAYMENT_RECEIVED",
                  entity: "Booking",
                  entityId: bookingId,
                  details: {
                    stripePaymentIntentId: booking.stripePaymentIntentId,
                    amount: existing.amount / 100,
                    currency: existing.currency,
                    recovery: "missed-webhook",
                  },
                },
              });
          });
          return NextResponse.json({ error: "Already paid", alreadyPaid: true }, { status: 400 });
        }
      } catch {
        // Stripe intent not found or stale — create a new one below
      }
    }

    // Create new payment intent
    const amountCents = eurosToCents(booking.totalAmount);

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      description: `AutoKos booking ${booking.bookingRef} – ${booking.car.name}`,
      metadata: {
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        customerEmail: booking.guestEmail ?? "",
        carName: booking.car.name,
      },
      receipt_email: booking.guestEmail ?? undefined,
      automatic_payment_methods: { enabled: true },
    });

    // Save intent ID + client secret
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        stripePaymentIntentId: intent.id,
        stripeClientSecret: intent.client_secret,
        paymentMethod: "online",
      },
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (error) {
    console.error("[Payments] create-intent error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
