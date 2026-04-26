// src/app/api/admin/locations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { checkAdminRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) return null;
  return session;
}

const schema = z.object({
  name: z.string().min(2).max(100).optional(),
  city: z.string().min(2).max(100).optional(),
  address: z.string().max(200).optional().or(z.literal("")),
  isAirport: z.boolean().optional(),
  pickupFee: z.number().min(0).optional(),
  dropoffFee: z.number().min(0).optional(),
  isPickupPoint: z.boolean().optional(),
  isDropoffPoint: z.boolean().optional(),
  isActive: z.boolean().optional(),
  description: z.string().max(500).optional().or(z.literal("")),
  sortOrder: z.number().int().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const location = await prisma.location.update({
    where: { id },
    data: { ...parsed.data, address: parsed.data.address || null, description: parsed.data.description || null },
  });

  return NextResponse.json({ location });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const bookingCount = await prisma.booking.count({
    where: { OR: [{ pickupLocationId: id }, { dropoffLocationId: id }], status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } },
  });

  if (bookingCount > 0) {
    return NextResponse.json({ error: `Cannot delete: ${bookingCount} active booking(s) use this location.` }, { status: 409 });
  }

  await prisma.location.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
