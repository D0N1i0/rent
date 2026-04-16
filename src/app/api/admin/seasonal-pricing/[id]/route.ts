// src/app/api/admin/seasonal-pricing/[id]/route.ts
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
  name: z.string().min(2, "Rule name must be at least 2 characters").max(100),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  pricePerDay: z.number().positive("Daily price must be greater than 0"),
  pricePerWeek: z.number().positive().nullable().optional(),
  isActive: z.boolean().default(true),
}).refine(
  (d) => d.endDate > d.startDate,
  { message: "End date must be after start date", path: ["endDate"] }
);

async function checkOverlap(
  carId: string,
  startDate: Date,
  endDate: Date,
  excludeId: string
): Promise<string | null> {
  const conflict = await prisma.seasonalPricing.findFirst({
    where: {
      carId,
      isActive: true,
      id: { not: excludeId },
      AND: [
        { startDate: { lt: endDate } },
        { endDate: { gt: startDate } },
      ],
    },
    select: { name: true, startDate: true, endDate: true },
  });
  if (!conflict) return null;
  return `Overlaps with existing rule "${conflict.name}" (${conflict.startDate.toLocaleDateString()} – ${conflict.endDate.toLocaleDateString()})`;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    const firstError = parsed.error.flatten().fieldErrors;
    const msg = Object.values(firstError).flat()[0] ?? parsed.error.flatten().formErrors[0] ?? "Invalid data";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);

  if (parsed.data.isActive) {
    const overlapMsg = await checkOverlap(parsed.data.carId, start, end, id);
    if (overlapMsg) return NextResponse.json({ error: overlapMsg }, { status: 409 });
  }

  const item = await prisma.seasonalPricing.update({
    where: { id },
    data: {
      carId: parsed.data.carId,
      name: parsed.data.name,
      startDate: start,
      endDate: end,
      pricePerDay: parsed.data.pricePerDay,
      pricePerWeek: parsed.data.pricePerWeek ?? null,
      isActive: parsed.data.isActive,
    },
  });
  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await prisma.seasonalPricing.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
