// src/app/api/admin/extras/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { checkAdminRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/get-ip";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) return null;
  return session;
}

const schema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().or(z.literal("")),
  price: z.number().min(0).optional(),
  pricingType: z.enum(["ONE_TIME", "PER_DAY", "PER_BOOKING"]).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  protectionCategory: z.enum(["BASIC", "CDW", "PREMIUM"]).nullable().optional(),
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

  const extra = await prisma.extra.update({
    where: { id },
    data: { ...parsed.data, description: parsed.data.description || null },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "EXTRA_UPDATED",
      entity: "Extra",
      entityId: extra.id,
      ipAddress: getClientIp(req),
      details: { name: extra.name, price: extra.price, isActive: extra.isActive, protectionCategory: extra.protectionCategory },
    },
  });

  return NextResponse.json({ extra });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const extra = await prisma.extra.findUnique({ where: { id }, select: { name: true, protectionCategory: true } });
  await prisma.extra.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "EXTRA_DELETED",
      entity: "Extra",
      entityId: id,
      ipAddress: getClientIp(req),
      details: { name: extra?.name, protectionCategory: extra?.protectionCategory },
    },
  });

  return NextResponse.json({ success: true });
}
