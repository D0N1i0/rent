// src/app/api/bookings/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { differenceInHours } from "date-fns";
import { sendBookingStatusEmail } from "@/lib/email";

const schema = z.object({
  bookingId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
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
          details: { reason, hoursUntilPickup, isFreeCancellation },
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

    return NextResponse.json({
      success: true,
      isFreeCancellation,
      message: isFreeCancellation
        ? "Booking cancelled successfully. No cancellation fee applies."
        : `Booking cancelled. Note: cancellations within ${FREE_CANCEL_HOURS} hours of pickup may incur a fee. Our team will be in touch.`,
    });
  } catch (error) {
    console.error("[Booking Cancel] Error:", error);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
