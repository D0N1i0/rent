// src/app/api/admin/extras/route.ts
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
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  price: z.number().min(0),
  pricingType: z.enum(["ONE_TIME", "PER_DAY", "PER_BOOKING"]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  protectionCategory: z.enum(["BASIC", "CDW", "PREMIUM"]).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const extra = await prisma.extra.create({
    data: { ...parsed.data, description: parsed.data.description || null, protectionCategory: parsed.data.protectionCategory ?? null },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "EXTRA_CREATED",
      entity: "Extra",
      entityId: extra.id,
      ipAddress: getClientIp(req),
      details: { name: extra.name, price: extra.price, pricingType: extra.pricingType, protectionCategory: extra.protectionCategory },
    },
  });

  return NextResponse.json({ extra }, { status: 201 });
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const extras = await prisma.extra.findMany({ orderBy: { sortOrder: "asc" }, take: 500 });
  return NextResponse.json({ extras });
}
