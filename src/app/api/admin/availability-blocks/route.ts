// src/app/api/admin/availability-blocks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      ?? parsed.error.flatten().formErrors[0]
      ?? "Invalid block data";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Verify car exists
  const car = await prisma.car.findUnique({
    where: { id: parsed.data.carId },
    select: { id: true },
  });
  if (!car) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  const item = await prisma.availabilityBlock.create({
    data: {
      carId: parsed.data.carId,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      reason: parsed.data.reason ?? null,
    },
  });
  return NextResponse.json({ item }, { status: 201 });
}
