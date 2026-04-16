import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) return null;
  return session;
}

const schema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).nullable().optional(),
  code: z.string().max(50).nullable().optional(),
  discountPct: z.number().min(0).max(100).nullable().optional(),
  discountAmt: z.number().min(0).nullable().optional(),
  minSubtotal: z.number().min(0).nullable().optional(),
  minRentalDays: z.number().int().min(1).nullable().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
}).refine(
  (data) => data.discountPct != null || data.discountAmt != null,
  { message: "At least one discount type (percentage or fixed amount) is required", path: ["discountPct"] }
);

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  // Check for duplicate coupon code
  if (parsed.data.code) {
    const existing = await prisma.offer.findUnique({ where: { code: parsed.data.code } });
    if (existing) return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
  }

  const offer = await prisma.offer.create({
    data: {
      ...parsed.data,
      validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : null,
      validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
    },
  });
  return NextResponse.json({ offer }, { status: 201 });
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const offers = await prisma.offer.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ offers });
}
