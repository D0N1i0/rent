// Admin: car maintenance log CRUD
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isAdminRole, getSessionRole } from "@/lib/authz";
import { checkAdminRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const createSchema = z.object({
  serviceDate: z.string().min(1, "Service date is required"),
  maintenanceType: z.string().min(1, "Type is required").max(100),
  description: z.string().max(1000).optional().or(z.literal("")),
  odometer: z.number().int().min(0).optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
  performedBy: z.string().max(200).optional().or(z.literal("")),
  nextServiceDate: z.string().optional().or(z.literal("")),
  nextServiceKm: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: carId } = await params;

  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const logs = await prisma.carMaintenanceLog.findMany({
    where: { carId },
    orderBy: { serviceDate: "desc" },
  });

  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: carId } = await params;

  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const car = await prisma.car.findUnique({ where: { id: carId }, select: { id: true, name: true } });
  if (!car) return NextResponse.json({ error: "Car not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const d = parsed.data;
  const log = await prisma.carMaintenanceLog.create({
    data: {
      carId,
      serviceDate: new Date(d.serviceDate),
      maintenanceType: d.maintenanceType,
      description: d.description?.trim() || null,
      odometer: d.odometer ?? null,
      cost: d.cost ?? null,
      performedBy: d.performedBy?.trim() || null,
      nextServiceDate: d.nextServiceDate?.trim() ? new Date(d.nextServiceDate) : null,
      nextServiceKm: d.nextServiceKm ?? null,
      notes: d.notes?.trim() || null,
      createdById: session.user.id ?? null,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "MAINTENANCE_LOG_CREATED",
      entity: "Car",
      entityId: carId,
      details: { maintenanceType: d.maintenanceType, serviceDate: d.serviceDate, carName: car.name },
    },
  });

  return NextResponse.json({ log }, { status: 201 });
}
