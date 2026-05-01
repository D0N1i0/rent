// src/app/api/admin/offers/[id]/route.ts
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
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  code: z.string().max(50).nullable().optional(),
  discountPct: z.number().min(0).max(100).nullable().optional(),
  discountAmt: z.number().min(0).nullable().optional(),
  minSubtotal: z.number().min(0).nullable().optional(),
  minRentalDays: z.number().int().min(1).nullable().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
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
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  // Check for duplicate coupon code (excluding the current offer)
  if (parsed.data.code) {
    const conflict = await prisma.offer.findFirst({
      where: { code: parsed.data.code, id: { not: id } },
    });
    if (conflict) {
      return NextResponse.json({ error: "Coupon code already in use by another offer" }, { status: 409 });
    }
  }

  const offer = await prisma.offer.update({
    where: { id },
    data: {
      ...parsed.data,
      validFrom:
        parsed.data.validFrom !== undefined
          ? parsed.data.validFrom
            ? new Date(parsed.data.validFrom)
            : null
          : undefined,
      validUntil:
        parsed.data.validUntil !== undefined
          ? parsed.data.validUntil
            ? new Date(parsed.data.validUntil)
            : null
          : undefined,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "OFFER_UPDATED",
      entity: "Offer",
      entityId: offer.id,
      ipAddress: getClientIp(req),
      details: { title: offer.title, code: offer.code, isActive: offer.isActive },
    },
  });

  return NextResponse.json({ offer });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const offer = await prisma.offer.findUnique({ where: { id }, select: { title: true, code: true } });
  await prisma.offer.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "OFFER_DELETED",
      entity: "Offer",
      entityId: id,
      ipAddress: getClientIp(req),
      details: { title: offer?.title, code: offer?.code },
    },
  });

  return NextResponse.json({ success: true });
}
