// src/app/(admin) booking detail API route
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { z } from "zod";
import { sendBookingStatusEmail } from "@/lib/email";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) return null;
  return session;
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "REJECTED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "NO_SHOW"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
  REJECTED: [],
};

const updateSchema = z.object({
  status: z
    .enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "REJECTED"])
    .optional(),
  paymentStatus: z
    .enum(["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED", "WAIVED"])
    .optional(),
  paymentMethod: z.string().max(50).nullable().optional(),
  internalNotes: z.string().max(2000).nullable().optional(),
  adminNotes: z.string().max(2000).nullable().optional(),
  cancellationReason: z.string().max(500).nullable().optional(),
  rejectionReason: z.string().max(500).nullable().optional(),
  damageNoted: z.boolean().optional(),
  damageDescription: z.string().max(1000).nullable().optional(),
  depositReturned: z.boolean().optional(),
  actualReturnMileage: z.number().int().positive().nullable().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      car: { include: { images: { where: { isPrimary: true } } } },
      pickupLocation: true,
      dropoffLocation: true,
      user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      extras: { include: { extra: true } },
      statusHistory: {
        include: { changedBy: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  return NextResponse.json({ booking });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update data" }, { status: 400 });
    }

    const updates = parsed.data;

    // Fetch current booking
    const current = await prisma.booking.findUnique({
      where: { id },
      select: { status: true, guestEmail: true, guestFirstName: true, car: { select: { name: true } } },
    });
    if (!current) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Validate status transition
    if (updates.status && updates.status !== current.status) {
      const allowed = VALID_STATUS_TRANSITIONS[current.status] ?? [];
      if (!allowed.includes(updates.status)) {
        return NextResponse.json(
          {
            error: `Cannot transition booking from ${current.status} to ${updates.status}. Allowed: ${allowed.join(", ") || "none"}`,
          },
          { status: 400 }
        );
      }
    }

    // Build update payload with lifecycle timestamps
    const updateData: Prisma.BookingUpdateInput = { ...updates };
    if (updates.status === "CONFIRMED") updateData.confirmedAt = new Date();
    if (updates.status === "IN_PROGRESS") updateData.pickedUpAt = new Date();
    if (updates.status === "COMPLETED") {
      updateData.completedAt = new Date();
      updateData.returnedAt = new Date();
    }
    if (updates.status === "CANCELLED") updateData.cancelledAt = new Date();
    if (updates.status === "REJECTED") updateData.rejectedAt = new Date();
    if (updates.depositReturned === true) updateData.depositReturnedAt = new Date();

    // Apply update + record status history in transaction
    const booking = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id },
        data: updateData,
      });

      if (updates.status && updates.status !== current.status) {
        await tx.bookingStatusHistory.create({
          data: {
            bookingId: id,
            fromStatus: current.status,
            toStatus: updates.status,
            reason:
              updates.cancellationReason ??
              updates.rejectionReason ??
              `Status changed to ${updates.status}`,
            changedById: session.user.id,
          },
        });

        await tx.activityLog.create({
          data: {
            userId: session.user.id,
            action: "BOOKING_STATUS_CHANGED",
            entity: "Booking",
            entityId: id,
            details: { from: current.status, to: updates.status },
          },
        });
      }

      return updated;
    });

    // Send status email notification (non-blocking)
    if (
      updates.status &&
      updates.status !== current.status &&
      current.guestEmail
    ) {
      sendBookingStatusEmail(current.guestEmail, {
        bookingRef: booking.bookingRef,
        firstName: current.guestFirstName ?? "Customer",
        carName: current.car.name,
        newStatus: updates.status,
        reason: updates.cancellationReason ?? updates.rejectionReason ?? undefined,
      }).catch((err) => console.error("[Email] Status notification failed:", err));
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("[Booking PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
