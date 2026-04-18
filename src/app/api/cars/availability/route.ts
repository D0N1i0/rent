// src/app/api/cars/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseISO } from "date-fns";
import { checkDateOverlap } from "@/lib/utils";
import { BOOKING_RULES } from "@/lib/booking-rules";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`availability:${ip}`, 60, 60 * 1000); // 60 per minute
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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
    const pickupDT = parseISO(`${pickupDate}T${pickupTime}:00`);
    const returnDT = parseISO(`${returnDate}T${returnTime}:00`);

    if (returnDT <= pickupDT) {
      return NextResponse.json({ available: false, reason: "Return must be after pickup" });
    }

    // Check existing bookings
    const existingBookings = await prisma.booking.findMany({
      where: {
        carId,
        status: { in: [...BOOKING_RULES.activeBookingStatuses] },
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
