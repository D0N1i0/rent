// src/app/api/admin/availability-blocks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { checkAdminRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { bookingConflictStatusFilter } from "@/lib/booking-rules";

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) return null;
  return session;
}

const schema = z.object({
  carId: z.string().min(1, "Vehicle is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().max(500).nullable().optional(),
}).refine(
  (d) => d.endDate >= d.startDate,
  { message: "End date must be on or after start date", path: ["endDate"] }
);

export async function GET() {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const items = await prisma.availabilityBlock.findMany({
    include: { car: { select: { name: true, brand: true } } },
    orderBy: [{ startDate: "desc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      ?? parsed.error.flatten().formErrors[0]
      ?? "Invalid block data";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const startDate = new Date(parsed.data.startDate);
  const endDate = new Date(parsed.data.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
    return NextResponse.json({ error: "Invalid availability date range" }, { status: 400 });
  }

  // Verify car exists
  const car = await prisma.car.findUnique({
    where: { id: parsed.data.carId },
    select: { id: true },
  });
  if (!car) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  const [existingBlock, bookingConflict] = await Promise.all([
    prisma.availabilityBlock.findFirst({
      where: {
        carId: parsed.data.carId,
        AND: [{ startDate: { lt: endDate } }, { endDate: { gt: startDate } }],
      },
      select: { id: true },
    }),
    prisma.booking.findFirst({
      where: {
        carId: parsed.data.carId,
        ...bookingConflictStatusFilter(),
        AND: [{ pickupDateTime: { lt: endDate } }, { dropoffDateTime: { gt: startDate } }],
      },
      select: { bookingRef: true },
    }),
  ]);

  if (existingBlock) {
    return NextResponse.json({ error: "This vehicle already has an availability block in that period" }, { status: 409 });
  }
  if (bookingConflict) {
    return NextResponse.json(
      { error: `This block overlaps booking ${bookingConflict.bookingRef}. Cancel or move the booking before blocking the vehicle.` },
      { status: 409 }
    );
  }

  const item = await prisma.availabilityBlock.create({
    data: {
      carId: parsed.data.carId,
      startDate,
      endDate,
      reason: parsed.data.reason ?? null,
    },
  });
  return NextResponse.json({ item }, { status: 201 });
}
