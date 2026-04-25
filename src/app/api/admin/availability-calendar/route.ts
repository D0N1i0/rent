// src/app/api/admin/availability-calendar/route.ts
// Returns fleet availability data (bookings + blocks) for a date window.
// Max window: 90 days to prevent unbounded queries.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";

const MAX_DAYS = 90;
const DEFAULT_DAYS = 27; // 28-day window (0-indexed)

function parseLocalDate(str: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const d = new Date(str + "T00:00:00.000Z");
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  // Default range: today → today + DEFAULT_DAYS
  const todayUTC = new Date();
  const todayStr = todayUTC.toISOString().slice(0, 10);

  const fromStr = searchParams.get("from") ?? todayStr;
  const toRaw = searchParams.get("to");

  const fromDate = parseLocalDate(fromStr);
  if (!fromDate) return NextResponse.json({ error: "Invalid 'from' date" }, { status: 400 });

  // Cap range at MAX_DAYS
  let toDate: Date;
  if (toRaw) {
    const parsed = parseLocalDate(toRaw);
    if (!parsed) return NextResponse.json({ error: "Invalid 'to' date" }, { status: 400 });
    const spanDays = Math.floor((parsed.getTime() - fromDate.getTime()) / 86_400_000);
    toDate = spanDays > MAX_DAYS
      ? new Date(fromDate.getTime() + MAX_DAYS * 86_400_000)
      : parsed;
  } else {
    toDate = new Date(fromDate.getTime() + DEFAULT_DAYS * 86_400_000);
  }

  if (toDate < fromDate) {
    return NextResponse.json({ error: "End date must not be before start date" }, { status: 400 });
  }

  const carIdFilter = searchParams.get("carId") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;

  const cars = await prisma.car.findMany({
    where: {
      isActive: true,
      ...(carIdFilter ? { id: carIdFilter } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    select: {
      id: true,
      name: true,
      brand: true,
      model: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
    },
    orderBy: [{ brand: "asc" }, { name: "asc" }],
  });

  const carIds = cars.map((c) => c.id);
  if (carIds.length === 0) {
    return NextResponse.json({ from: fromStr, to: toDate.toISOString().slice(0, 10), cars: [], bookings: [], availabilityBlocks: [] });
  }

  // Include bookings that overlap [fromDate, toDate+1day)
  const rangeEnd = new Date(toDate.getTime() + 86_400_000);

  const [bookings, availabilityBlocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        carId: { in: carIds },
        pickupDateTime: { lt: rangeEnd },
        dropoffDateTime: { gt: fromDate },
      },
      select: {
        id: true,
        bookingRef: true,
        carId: true,
        status: true,
        pickupDateTime: true,
        dropoffDateTime: true,
        guestFirstName: true,
        guestLastName: true,
        totalAmount: true,
      },
      orderBy: { pickupDateTime: "asc" },
    }),
    prisma.availabilityBlock.findMany({
      where: {
        carId: { in: carIds },
        startDate: { lt: rangeEnd },
        endDate: { gt: fromDate },
      },
      select: {
        id: true,
        carId: true,
        reason: true,
        startDate: true,
        endDate: true,
      },
    }),
  ]);

  return NextResponse.json({
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
    cars,
    // Decimals are auto-converted to numbers by Prisma middleware
    bookings: bookings.map((b) => ({
      id: b.id,
      bookingRef: b.bookingRef,
      carId: b.carId,
      status: b.status as string,
      pickupDateTime: (b.pickupDateTime as Date).toISOString(),
      dropoffDateTime: (b.dropoffDateTime as Date).toISOString(),
      guestFirstName: b.guestFirstName,
      guestLastName: b.guestLastName,
      totalAmount: b.totalAmount as unknown as number,
    })),
    availabilityBlocks: availabilityBlocks.map((bl) => ({
      id: bl.id,
      carId: bl.carId,
      reason: bl.reason,
      startDate: (bl.startDate as Date).toISOString(),
      endDate: (bl.endDate as Date).toISOString(),
    })),
  });
}
