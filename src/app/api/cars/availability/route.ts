// src/app/api/cars/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDateOverlap } from "@/lib/utils";
import { bookingConflictStatusFilter, kosovoWallTimeToUtc } from "@/lib/booking-rules";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const carId = searchParams.get("carId");
  const pickupDate = searchParams.get("pickupDate");
  const pickupTime = searchParams.get("pickupTime");
  const returnDate = searchParams.get("returnDate");
  const returnTime = searchParams.get("returnTime");
  const excludeBookingId = searchParams.get("excludeBookingId");

  if (!carId || !pickupDate || !pickupTime || !returnDate || !returnTime) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    // Interpret client-submitted wall-clock as Kosovo local time, not UTC.
    const pickupDT = kosovoWallTimeToUtc(pickupDate, pickupTime);
    const returnDT = kosovoWallTimeToUtc(returnDate, returnTime);

    if (returnDT <= pickupDT) {
      return NextResponse.json({ available: false, reason: "Return must be after pickup" });
    }

    // Check existing bookings
    const existingBookings = await prisma.booking.findMany({
      where: {
        carId,
        ...bookingConflictStatusFilter(),
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: { pickupDateTime: true, dropoffDateTime: true },
    });

    for (const booking of existingBookings) {
      if (checkDateOverlap(booking.pickupDateTime, booking.dropoffDateTime, pickupDT, returnDT)) {
        return NextResponse.json({ available: false, reason: "Car is already booked for these dates" });
      }
    }

    // Check maintenance blocks
    const blocks = await prisma.availabilityBlock.findMany({ where: { carId } });
    for (const block of blocks) {
      if (checkDateOverlap(block.startDate, block.endDate, pickupDT, returnDT)) {
        return NextResponse.json({ available: false, reason: block.reason ?? "Car unavailable during this period" });
      }
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
  }
}
