// src/app/api/cars/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingConflictStatusFilter, kosovoWallTimeToUtc, validateBookingWindow } from "@/lib/booking-rules";

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

    const windowError = validateBookingWindow(pickupDT, returnDT);
    if (windowError) {
      return NextResponse.json({ available: false, reason: windowError });
    }

    const car = await prisma.car.findFirst({
      where: { id: carId, isActive: true },
      select: { id: true },
    });
    if (!car) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Keep these queries range-filtered. Fetching every historical booking/block
    // for a popular car makes availability checks slower as the business grows.
    const [existingBooking, block] = await Promise.all([
      prisma.booking.findFirst({
        where: {
          carId,
          ...bookingConflictStatusFilter(),
          ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
          AND: [{ pickupDateTime: { lt: returnDT } }, { dropoffDateTime: { gt: pickupDT } }],
        },
        select: { id: true },
      }),
      prisma.availabilityBlock.findFirst({
        where: {
          carId,
          AND: [{ startDate: { lt: returnDT } }, { endDate: { gt: pickupDT } }],
        },
        select: { reason: true },
      }),
    ]);

    if (existingBooking) {
      return NextResponse.json({ available: false, reason: "Car is already booked for these dates" });
    }

    if (block) {
      return NextResponse.json({ available: false, reason: block.reason ?? "Car unavailable during this period" });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
  }
}
