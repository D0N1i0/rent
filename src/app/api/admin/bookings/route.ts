// src/app/api/admin/bookings/route.ts
// Admin manual booking creation. Bypasses the 2-hour lead time and acceptTerms
// requirements. All availability/overlap safety is identical to public bookings.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { adminBookingSchema } from "@/lib/validations/admin-booking";
import { generateBookingRef } from "@/lib/utils";
import { buildPriceBreakdown, buildExtraLineItems } from "@/lib/pricing";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { toNumber } from "@/lib/money";
import {
  bookingConflictStatusFilter,
  buildBookingDateTimes,
  calculateOfferDiscount,
  closeAbandonedPendingBookings,
  getDurationDays,
} from "@/lib/booking-rules";

const MAX_REF_RETRIES = 5;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const adminId = session.user.id ?? null;

  const body = await req.json().catch(() => null);
  const parsed = adminBookingSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat()[0];
    return NextResponse.json({ error: firstError ?? "Validation failed" }, { status: 400 });
  }

  const data = parsed.data;
  const selectedExtraIds = Array.from(new Set(data.selectedExtras));

  closeAbandonedPendingBookings().catch((err) =>
    console.error("[booking-cleanup] failed:", err)
  );

  // ── Build datetimes ─────────────────────────────────────────────────────────
  const { pickupDT, returnDT } = buildBookingDateTimes({
    pickupDate: data.pickupDate,
    pickupTime: data.pickupTime,
    returnDate: data.returnDate,
    returnTime: data.returnTime,
  });

  if (Number.isNaN(pickupDT.getTime()) || Number.isNaN(returnDT.getTime())) {
    return NextResponse.json({ error: "Invalid pickup or return date" }, { status: 400 });
  }

  // Admin may book same-day / past-day for walk-ins — only enforce return > pickup
  if (returnDT <= pickupDT) {
    return NextResponse.json({ error: "Return date and time must be after pickup" }, { status: 400 });
  }

  // ── Validate car ────────────────────────────────────────────────────────────
  const car = await prisma.car.findFirst({
    where: { id: data.carId, isActive: true },
    include: { seasonalPricing: { where: { isActive: true } } },
  });
  if (!car) {
    return NextResponse.json({ error: "Selected vehicle is not available" }, { status: 400 });
  }

  // ── Pre-flight conflict check (fast, before advisory lock) ──────────────────
  const conflicting = await prisma.booking.findFirst({
    where: {
      carId: car.id,
      ...bookingConflictStatusFilter(),
      AND: [{ pickupDateTime: { lt: returnDT } }, { dropoffDateTime: { gt: pickupDT } }],
    },
  });
  if (conflicting) {
    return NextResponse.json(
      { error: "This vehicle is already booked for the selected dates. Please choose different dates." },
      { status: 409 }
    );
  }

  const blockConflict = await prisma.availabilityBlock.findFirst({
    where: {
      carId: car.id,
      AND: [{ startDate: { lt: returnDT } }, { endDate: { gt: pickupDT } }],
    },
  });
  if (blockConflict) {
    return NextResponse.json(
      { error: blockConflict.reason ?? "This vehicle is unavailable for the selected period." },
      { status: 409 }
    );
  }

  // ── Validate locations ──────────────────────────────────────────────────────
  const [pickupLoc, dropoffLoc] = await Promise.all([
    prisma.location.findFirst({ where: { id: data.pickupLocationId, isActive: true, isPickupPoint: true } }),
    prisma.location.findFirst({ where: { id: data.dropoffLocationId, isActive: true, isDropoffPoint: true } }),
  ]);
  if (!pickupLoc) return NextResponse.json({ error: "Invalid pickup location" }, { status: 400 });
  if (!dropoffLoc) return NextResponse.json({ error: "Invalid drop-off location" }, { status: 400 });

  // ── Price extras ────────────────────────────────────────────────────────────
  let extraLineItems: ReturnType<typeof buildExtraLineItems> = [];
  if (selectedExtraIds.length > 0) {
    const extraRecords = await prisma.extra.findMany({
      where: { id: { in: selectedExtraIds }, isActive: true },
    });
    if (extraRecords.length !== selectedExtraIds.length) {
      return NextResponse.json(
        { error: "One or more selected extras are no longer available" },
        { status: 400 }
      );
    }
    extraLineItems = buildExtraLineItems(extraRecords, selectedExtraIds, getDurationDays(pickupDT, returnDT));
  }

  // ── Coupon ──────────────────────────────────────────────────────────────────
  const normalizedCouponCode = typeof data.couponCode === "string"
    ? data.couponCode.trim().toUpperCase().slice(0, 50)
    : "";

  let couponDiscount = 0;
  if (normalizedCouponCode) {
    const offer = await prisma.offer.findFirst({ where: { code: normalizedCouponCode } });
    if (offer) {
      const provisional = buildPriceBreakdown(car, pickupDT, returnDT, pickupLoc, dropoffLoc, extraLineItems);
      couponDiscount = calculateOfferDiscount({
        offer,
        subtotal: provisional.subtotal + provisional.extrasTotal + provisional.pickupFee + provisional.dropoffFee,
        durationDays: provisional.durationDays,
      });
    }
  }

  // ── Full price breakdown ────────────────────────────────────────────────────
  const breakdown = buildPriceBreakdown(car, pickupDT, returnDT, pickupLoc, dropoffLoc, extraLineItems, couponDiscount);

  // ── Resolve userId ──────────────────────────────────────────────────────────
  const linkedUserId = data.userId?.trim() || null;
  if (linkedUserId) {
    const userExists = await prisma.user.findUnique({ where: { id: linkedUserId }, select: { id: true } });
    if (!userExists) return NextResponse.json({ error: "Linked user not found" }, { status: 400 });
  }

  // ── Create booking with advisory lock + retry on ref collision ──────────────
  let booking: Awaited<ReturnType<typeof prisma.booking.create>> | null = null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_REF_RETRIES; attempt++) {
    const bookingRef = generateBookingRef();
    try {
      booking = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`,
          car.id
        );

        const raceConflict = await tx.booking.findFirst({
          where: {
            carId: car.id,
            ...bookingConflictStatusFilter(),
            AND: [{ pickupDateTime: { lt: returnDT } }, { dropoffDateTime: { gt: pickupDT } }],
          },
        });
        if (raceConflict) throw new Error("RACE_CONFLICT");

        const raceBlock = await tx.availabilityBlock.findFirst({
          where: {
            carId: car.id,
            AND: [{ startDate: { lt: returnDT } }, { endDate: { gt: pickupDT } }],
          },
        });
        if (raceBlock) throw new Error("RACE_BLOCK");

        const newBooking = await tx.booking.create({
          data: {
            bookingRef,
            userId: linkedUserId,
            carId: car.id,
            pickupLocationId: pickupLoc.id,
            dropoffLocationId: dropoffLoc.id,
            pickupDateTime: pickupDT,
            dropoffDateTime: returnDT,
            durationDays: breakdown.durationDays,
            guestFirstName: data.firstName.trim(),
            guestLastName: data.lastName.trim(),
            guestEmail: data.email.toLowerCase().trim(),
            guestPhone: data.phone.trim(),
            guestIdNumber: data.idNumber?.trim() ?? null,
            guestLicense: data.licenseNumber?.trim() ?? null,
            guestNationality: data.nationality?.trim() ?? null,
            basePricePerDay: breakdown.pricePerDay,
            pricingTier: breakdown.pricingTier,
            subtotal: breakdown.subtotal,
            extrasTotal: breakdown.extrasTotal,
            pickupFee: breakdown.pickupFee,
            dropoffFee: breakdown.dropoffFee,
            discount: breakdown.discount,
            vatRate: breakdown.vatRate,
            vatAmount: breakdown.vatAmount,
            couponCode: normalizedCouponCode || null,
            depositAmount: toNumber(car.deposit),
            totalAmount: breakdown.totalAmount,
            specialRequests: data.specialRequests?.trim() || null,
            internalNotes: data.internalNotes?.trim() || null,
            // CONFIRMED status sets confirmedAt but paymentStatus is always UNPAID
            status: data.status,
            paymentStatus: "UNPAID",
            ...(data.status === "CONFIRMED" ? { confirmedAt: new Date() } : {}),
          },
        });

        await tx.bookingStatusHistory.create({
          data: {
            bookingId: newBooking.id,
            fromStatus: null,
            toStatus: data.status,
            reason: `Created manually by admin`,
            changedById: adminId,
          },
        });

        if (extraLineItems.length > 0) {
          await tx.bookingExtra.createMany({
            data: extraLineItems.map((e) => ({ ...e, bookingId: newBooking.id })),
          });
        }

        await tx.activityLog.create({
          data: {
            userId: adminId,
            action: "BOOKING_CREATED",
            entity: "Booking",
            entityId: newBooking.id,
            details: {
              bookingRef,
              carName: car.name,
              total: breakdown.totalAmount,
              createdByAdmin: true,
              initialStatus: data.status,
            },
          },
        });

        return newBooking;
      });

      break;
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message === "RACE_CONFLICT" || error.message === "RACE_BLOCK") {
        return NextResponse.json(
          { error: "This vehicle just became unavailable. Please refresh and try again." },
          { status: 409 }
        );
      }
      if (error.message?.includes("Unique constraint") || error.message?.includes("P2002")) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  if (!booking) {
    console.error("All booking ref attempts failed:", lastError);
    return NextResponse.json({ error: "Failed to create booking. Please try again." }, { status: 500 });
  }

  // ── Optional confirmation email ─────────────────────────────────────────────
  if (data.sendConfirmationEmail) {
    sendBookingConfirmationEmail(data.email, {
      bookingRef: booking.bookingRef,
      firstName: data.firstName,
      carName: car.name,
      pickupLocation: pickupLoc.name,
      dropoffLocation: dropoffLoc.name,
      pickupDateTime: pickupDT,
      dropoffDateTime: returnDT,
      totalAmount: breakdown.totalAmount,
      depositAmount: toNumber(car.deposit),
    }).catch((err) => console.error("[Email] Admin booking confirmation send failed:", err));
  }

  return NextResponse.json(
    { bookingRef: booking.bookingRef, bookingId: booking.id },
    { status: 201 }
  );
}
