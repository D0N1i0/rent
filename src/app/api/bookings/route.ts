// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { bookingSchema } from "@/lib/validations/booking";
import { generateBookingRef } from "@/lib/utils";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";
import { buildPriceBreakdown, buildExtraLineItems } from "@/lib/pricing";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { BOOKING_RULES, buildBookingDateTimes, calculateOfferDiscount, validateBookingWindow, getDurationDays } from "@/lib/booking-rules";

const MAX_REF_RETRIES = 5;

export async function POST(req: NextRequest) {
  // Rate limit: 20 booking attempts per hour per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`booking:${ip}`, 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return tooManyRequests("Too many booking attempts. Please wait before trying again.", rl.resetAt);
  }

  try {
    const body = await req.json();

    // ── 1. Schema validation ──────────────────────────────────────────────────
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0];
      return NextResponse.json({ error: firstError ?? "Validation failed" }, { status: 400 });
    }

    const data = parsed.data;
    const selectedExtraIds: string[] = body.selectedExtras ?? [];

    // ── 2. Build datetime objects ─────────────────────────────────────────────
    const { pickupDT, returnDT } = buildBookingDateTimes({
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      returnDate: data.returnDate,
      returnTime: data.returnTime,
    });

    // ── 3. Business rule validation ───────────────────────────────────────────
    const bookingWindowError = validateBookingWindow(pickupDT, returnDT);
    if (bookingWindowError) {
      return NextResponse.json({ error: bookingWindowError }, { status: 400 });
    }

    // ── 4. Validate car exists, is active and rentable ────────────────────────
    const car = await prisma.car.findFirst({ where: { id: data.carId, isActive: true }, include: { seasonalPricing: { where: { isActive: true } } } });
    if (!car) {
      return NextResponse.json({ error: "Selected vehicle is not available" }, { status: 400 });
    }

    // ── 5. Check overlapping bookings (pre-transaction fast check) ────────────
    const conflicting = await prisma.booking.findFirst({
      where: {
        carId: car.id,
        status: { in: [...BOOKING_RULES.activeBookingStatuses] },
        AND: [{ pickupDateTime: { lt: returnDT } }, { dropoffDateTime: { gt: pickupDT } }],
      },
    });
    if (conflicting) {
      return NextResponse.json(
        { error: "This vehicle is already booked for the selected dates. Please choose different dates." },
        { status: 409 }
      );
    }

    // ── 6. Check maintenance / unavailability blocks ───────────────────────────
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

    // ── 7. Validate locations ─────────────────────────────────────────────────
    const [pickupLoc, dropoffLoc] = await Promise.all([
      prisma.location.findFirst({ where: { id: data.pickupLocationId, isActive: true, isPickupPoint: true } }),
      prisma.location.findFirst({ where: { id: data.dropoffLocationId, isActive: true, isDropoffPoint: true } }),
    ]);

    if (!pickupLoc) return NextResponse.json({ error: "Invalid pickup location" }, { status: 400 });
    if (!dropoffLoc) return NextResponse.json({ error: "Invalid drop-off location" }, { status: 400 });

    // ── 8. Validate & price extras ────────────────────────────────────────────
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
      // Use pricing service to calculate duration first
      const tempDuration = getDurationDays(pickupDT, returnDT);
      extraLineItems = buildExtraLineItems(extraRecords, selectedExtraIds, tempDuration);
    }

    let couponDiscount = 0;
    if (body.couponCode) {
      const offer = await prisma.offer.findFirst({
        where: { code: String(body.couponCode).trim().toUpperCase() },
      });
      if (offer) {
        const provisional = buildPriceBreakdown(car, pickupDT, returnDT, pickupLoc, dropoffLoc, extraLineItems);
        couponDiscount = calculateOfferDiscount({
          offer,
          subtotal: provisional.subtotal + provisional.extrasTotal + provisional.pickupFee + provisional.dropoffFee,
          durationDays: provisional.durationDays,
        });
      }
    }

    // ── 9. Build full price breakdown via pricing service ─────────────────────
    const breakdown = buildPriceBreakdown(car, pickupDT, returnDT, pickupLoc, dropoffLoc, extraLineItems, couponDiscount);

    // ── 10. Get user session ──────────────────────────────────────────────────
    const session = await auth();
    const userId = session?.user?.id ?? null;

    // ── 11. Create booking in a transaction with retry on ref collision ────────
    let booking: Awaited<ReturnType<typeof prisma.booking.create>> | null = null;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_REF_RETRIES; attempt++) {
      const bookingRef = generateBookingRef();
      try {
        booking = await prisma.$transaction(async (tx) => {
          // Re-check for race conditions inside the transaction
          const raceConflict = await tx.booking.findFirst({
            where: {
              carId: car.id,
              status: { in: [...BOOKING_RULES.activeBookingStatuses] },
              AND: [{ pickupDateTime: { lt: returnDT } }, { dropoffDateTime: { gt: pickupDT } }],
            },
          });
          if (raceConflict) {
            throw new Error("RACE_CONFLICT");
          }

          const newBooking = await tx.booking.create({
            data: {
              bookingRef,
              userId,
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
              couponCode: body.couponCode ? String(body.couponCode).trim().toUpperCase() : null,
              depositAmount: car.deposit,
              totalAmount: breakdown.totalAmount,
              specialRequests: data.specialRequests?.trim() || null,
              status: "PENDING",
              paymentStatus: "UNPAID",
            },
          });

          // Record initial status history
          await tx.bookingStatusHistory.create({
            data: {
              bookingId: newBooking.id,
              fromStatus: null,
              toStatus: "PENDING",
              reason: "Booking created",
              changedById: userId,
            },
          });

          // Create booking extras
          if (extraLineItems.length > 0) {
            await tx.bookingExtra.createMany({
              data: extraLineItems.map((e) => ({ ...e, bookingId: newBooking.id })),
            });
          }

          // Update user profile data if opted-in
          // Only write fields that don't conflict with another account (belt-and-suspenders check inside the transaction)
          if (userId) {
            const user = await tx.user.findUnique({
              where: { id: userId },
              select: { saveProfileData: true },
            });
            if (user?.saveProfileData) {
              const profileUpdate: Record<string, string | undefined> = {
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
              };

              const phone = data.phone.trim();
              if (phone) {
                const phoneConflict = await tx.user.findFirst({ where: { phone, id: { not: userId } } });
                if (!phoneConflict) profileUpdate.phone = phone;
              }

              const idNum = data.idNumber?.trim();
              if (idNum) {
                const idConflict = await tx.user.findFirst({ where: { idNumber: idNum, id: { not: userId } } });
                if (!idConflict) profileUpdate.idNumber = idNum;
              }

              const licNum = data.licenseNumber?.trim();
              if (licNum) {
                const licConflict = await tx.user.findFirst({ where: { licenseNumber: licNum, id: { not: userId } } });
                if (!licConflict) profileUpdate.licenseNumber = licNum;
              }

              await tx.user.update({ where: { id: userId }, data: profileUpdate });
            }
          }

          // Activity log
          await tx.activityLog.create({
            data: {
              userId,
              action: "BOOKING_CREATED",
              entity: "Booking",
              entityId: newBooking.id,
              details: { bookingRef, carName: car.name, total: breakdown.totalAmount },
            },
          });

          return newBooking;
        });

        // Transaction succeeded — break retry loop
        break;
      } catch (err: unknown) {
        const error = err as Error;
        if (error.message === "RACE_CONFLICT") {
          return NextResponse.json(
            { error: "This vehicle just became unavailable. Please refresh and try again." },
            { status: 409 }
          );
        }
        // Unique constraint on bookingRef — retry with new ref
        if (
          error.message?.includes("Unique constraint") ||
          error.message?.includes("P2002")
        ) {
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    if (!booking) {
      console.error("All booking ref attempts failed:", lastError);
      return NextResponse.json(
        { error: "Failed to create booking. Please try again." },
        { status: 500 }
      );
    }

    // ── 12. Send confirmation email (non-blocking) ────────────────────────────
    sendBookingConfirmationEmail(data.email, {
      bookingRef: booking.bookingRef,
      firstName: data.firstName,
      carName: car.name,
      pickupLocation: pickupLoc.name,
      dropoffLocation: dropoffLoc.name,
      pickupDateTime: pickupDT,
      dropoffDateTime: returnDT,
      totalAmount: breakdown.totalAmount,
      depositAmount: car.deposit,
    }).catch((err) => console.error("[Email] Confirmation send failed:", err));

    return NextResponse.json(
      { bookingRef: booking.bookingRef, bookingId: booking.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Booking] Unexpected error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userRole = session.user.role;

  if (userRole === "ADMIN" || userRole === "STAFF") {
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);
    const status = searchParams.get("status");
    const validStatuses = ["PENDING","CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED","NO_SHOW","REJECTED"] as const;
    type BS = typeof validStatuses[number];
    const where = status && status !== "ALL" && validStatuses.includes(status as BS)
      ? { status: status as BS }
      : {};

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          car: { select: { name: true, brand: true } },
          pickupLocation: { select: { name: true } },
          dropoffLocation: { select: { name: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({ bookings, total, page, limit });
  }

  // Customer — own bookings only
  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      car: { include: { images: { where: { isPrimary: true } } } },
      pickupLocation: true,
      dropoffLocation: true,
      extras: { include: { extra: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings });
}
