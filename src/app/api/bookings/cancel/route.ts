// src/app/api/bookings/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { differenceInHours } from "date-fns";
import { sendBookingStatusEmail } from "@/lib/email";
import { stripe } from "@/lib/stripe";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  bookingId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit: 10 cancel attempts per hour per IP
  const ip = getClientIp(req);
  const rl = await rateLimit(`cancel:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const { bookingId, reason } = parsed.data;

    // Fetch booking and verify ownership
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId: session.user.id },
      include: { car: { select: { name: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Can only cancel PENDING or CONFIRMED bookings
    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return NextResponse.json(
        {
          error: `This booking cannot be cancelled (current status: ${booking.status}). Please contact us for assistance.`,
        },
        { status: 400 }
      );
    }

    // Cancellation policy: check hours until pickup
    const hoursUntilPickup = differenceInHours(booking.pickupDateTime, new Date());
    const FREE_CANCEL_HOURS = 48;
    const isFreeCancellation = hoursUntilPickup >= FREE_CANCEL_HOURS;
    const wasPaid = booking.paymentStatus === "PAID";

    // Auto-refund the full amount if the customer is within the free
    // cancellation window AND has already paid via Stripe. Outside that
    // window we still cancel the booking but leave the refund to operator
    // discretion (cancellation fee may apply). If the Stripe refund call
    // fails, we still cancel the booking and flag the anomaly in the
    // activity log so it surfaces in the admin UI.
    let refundId: string | null = null;
    let refundError: string | null = null;
    const shouldAutoRefund = wasPaid && isFreeCancellation && !!booking.stripePaymentIntentId;
    if (shouldAutoRefund) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: booking.stripePaymentIntentId!,
          reason: "requested_by_customer",
          metadata: {
            bookingId: booking.id,
            bookingRef: booking.bookingRef,
            initiatedBy: "customer-cancel",
          },
        });
        refundId = refund.id;
      } catch (err) {
        refundError = String((err as Error)?.message ?? err).slice(0, 500);
        console.error("[Booking Cancel] Auto-refund failed:", refundError);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: reason?.trim() || "Customer requested cancellation",
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: booking.status,
          toStatus: "CANCELLED",
          reason: reason?.trim() || "Customer requested cancellation",
          changedById: session.user.id,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "BOOKING_CANCELLED_BY_CUSTOMER",
          entity: "Booking",
          entityId: bookingId,
          details: { reason, hoursUntilPickup, isFreeCancellation, wasPaid, refundId, refundError, shouldAutoRefund },
        },
      });
    });

    // Send cancellation confirmation email
    if (booking.guestEmail) {
      sendBookingStatusEmail(booking.guestEmail, {
        bookingRef: booking.bookingRef,
        firstName: booking.guestFirstName ?? "Customer",
        carName: booking.car.name,
        newStatus: "CANCELLED",
        reason: reason ?? "Customer requested cancellation",
      }).catch((err) => console.error("[Email] Cancellation email failed:", err));
    }

    let message: string;
    if (!wasPaid) {
      message = isFreeCancellation
        ? "Booking cancelled successfully."
        : `Booking cancelled. Note: cancellations within ${FREE_CANCEL_HOURS} hours of pickup may incur a fee.`;
    } else if (shouldAutoRefund && refundId) {
      message = "Booking cancelled and a full refund has been issued. Funds typically appear within 5-10 business days.";
    } else if (shouldAutoRefund && !refundId) {
      message = "Booking cancelled. The automatic refund did not go through — our team has been notified and will process it manually.";
    } else {
      message = `Booking cancelled. Because you cancelled within ${FREE_CANCEL_HOURS} hours of pickup, a cancellation fee may apply; our team will review and refund any balance due.`;
    }

    return NextResponse.json({
      success: true,
      isFreeCancellation,
      refunded: !!refundId,
      refundId,
      message,
    });
  } catch (error) {
    console.error("[Booking Cancel] Error:", error);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
