// src/app/api/admin/refunds/route.ts
// Admin-initiated Stripe refund.
// Security: ADMIN-only (not STAFF), server recomputes max-refundable from DB —
// never trusts the client-supplied amount beyond "is it a positive number?".
// Arithmetic is done in integer cents to avoid floating-point accumulation across
// multiple partial refunds.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkAdminRateLimit } from "@/lib/rate-limit";
import { stripe, eurosToCents } from "@/lib/stripe";
import { toNumber } from "@/lib/money";
import { sendRefundEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  bookingId: z.string().min(1),
  amount: z.number().positive().max(100_000),
  reason: z.string().min(5).max(500).trim(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  // Refunds are restricted to ADMIN role only — STAFF cannot issue refunds.
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const rl = await checkAdminRateLimit(req, session.user.id, "refund");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request: " + parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const { bookingId, amount, reason } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingRef: true,
      stripePaymentIntentId: true,
      totalAmount: true,
      amountRefunded: true,
      paymentStatus: true,
      guestFirstName: true,
      guestEmail: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!booking.stripePaymentIntentId) {
    return NextResponse.json(
      { error: "This booking has no Stripe payment — refund it manually." },
      { status: 400 }
    );
  }

  if (booking.paymentStatus !== "PAID" && booking.paymentStatus !== "PARTIALLY_PAID") {
    return NextResponse.json(
      { error: `Cannot refund a booking with payment status: ${booking.paymentStatus}` },
      { status: 400 }
    );
  }

  // Work entirely in integer cents to prevent floating-point accumulation across
  // multiple partial refunds (e.g. 3 × €33.33 summing to €99.98 instead of €99.99).
  const totalCents = Math.round(toNumber(booking.totalAmount) * 100);
  const alreadyRefundedCents = Math.round(toNumber(booking.amountRefunded) * 100);
  const requestedCents = eurosToCents(amount); // Math.round(amount * 100)
  const maxRefundableCents = totalCents - alreadyRefundedCents;

  if (maxRefundableCents <= 0) {
    return NextResponse.json(
      { error: "This booking has already been fully refunded." },
      { status: 400 }
    );
  }

  if (requestedCents > maxRefundableCents) {
    return NextResponse.json(
      {
        error: `Refund amount €${amount.toFixed(2)} exceeds the refundable balance of €${(maxRefundableCents / 100).toFixed(2)}.`,
      },
      { status: 400 }
    );
  }

  // ── Issue Stripe refund ───────────────────────────────────────────────────
  let stripeRefund: Awaited<ReturnType<typeof stripe.refunds.create>>;
  try {
    stripeRefund = await stripe.refunds.create(
      {
        payment_intent: booking.stripePaymentIntentId,
        amount: requestedCents, // already in cents, computed above
        reason: "requested_by_customer",
        metadata: {
          bookingId: booking.id,
          bookingRef: booking.bookingRef,
          adminUserId: session.user.id ?? "",
          internalReason: reason.slice(0, 200),
        },
      },
      {
        // Idempotency: keyed on booking + amount + initiating admin + minute-window.
        // Prevents network-retry double-charges; a genuine second refund in the
        // same minute with the same amount will hit the idempotency cache on Stripe.
        idempotencyKey: `refund-${booking.id}-${eurosToCents(amount)}-${session.user.id}-${Math.floor(Date.now() / 60_000)}`,
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Stripe refund failed";
    console.error("[Refund] Stripe error:", msg);
    return NextResponse.json({ error: `Stripe error: ${msg}` }, { status: 502 });
  }

  if (stripeRefund.status === "failed") {
    return NextResponse.json(
      { error: "Stripe reported the refund as failed. Check Stripe dashboard." },
      { status: 502 }
    );
  }

  // ── Persist refund in one transaction ────────────────────────────────────
  // Keep arithmetic in cents; convert back to euros only for DB storage.
  const newRefundedCents = alreadyRefundedCents + requestedCents;
  const newAmountRefunded = newRefundedCents / 100;
  const isFullRefund = newRefundedCents >= totalCents;
  const newPaymentStatus = isFullRefund ? "REFUNDED" : "PAID";

  await prisma.$transaction(async (tx) => {
    // Idempotent write — upsert on stripeRefundId so webhook + admin UI can
    // both try to store the same refund without duplicating.
    await tx.refundRecord.upsert({
      where: { stripeRefundId: stripeRefund.id },
      update: { status: stripeRefund.status ?? "SUCCEEDED" },
      create: {
        bookingId: booking.id,
        stripeRefundId: stripeRefund.id,
        amount: amount,
        reason,
        status: stripeRefund.status ?? "SUCCEEDED",
        initiatedById: session.user.id ?? null,
      },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        amountRefunded: newAmountRefunded,
        paymentStatus: newPaymentStatus,
      },
    });

    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: isFullRefund ? "PAYMENT_REFUNDED" : "PAYMENT_PARTIALLY_REFUNDED",
        entity: "Booking",
        entityId: booking.id,
        details: {
          stripeRefundId: stripeRefund.id,
          amountRefunded: amount,
          totalRefunded: newAmountRefunded,
          reason,
          isFullRefund,
        },
      },
    });
  });

  // ── Refund email (non-blocking) ───────────────────────────────────────────
  const customerEmail = booking.guestEmail;
  if (customerEmail) {
    sendRefundEmail(customerEmail, {
      bookingRef: booking.bookingRef,
      customerFirstName: booking.guestFirstName ?? "Customer",
      amount,
      isFullRefund,
      reason,
    }).catch((err) => console.error("[Refund] Email send failed:", err));
  }

  return NextResponse.json({
    success: true,
    stripeRefundId: stripeRefund.id,
    amountRefunded: amount,
    totalRefunded: newAmountRefunded,
    newPaymentStatus,
    isFullRefund,
  });
}
