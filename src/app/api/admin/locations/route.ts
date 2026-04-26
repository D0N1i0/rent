// src/app/api/admin/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { checkAdminRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) return null;
  return session;
}

const schema = z.object({
  name: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  address: z.string().max(200).optional().or(z.literal("")),
  isAirport: z.boolean().default(false),
  pickupFee: z.number().min(0).default(0),
  dropoffFee: z.number().min(0).default(0),
  isPickupPoint: z.boolean().default(true),
  isDropoffPoint: z.boolean().default(true),
  isActive: z.boolean().default(true),
  description: z.string().max(500).optional().or(z.literal("")),
  sortOrder: z.number().int().default(0),
});

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  let slug = slugify(parsed.data.name);
  let counter = 1;
  while (await prisma.location.findUnique({ where: { slug } })) {
    slug = `${slugify(parsed.data.name)}-${counter++}`;
  }

  const location = await prisma.location.create({
    data: { ...parsed.data, slug, address: parsed.data.address || null, description: parsed.data.description || null },
  });

  return NextResponse.json({ location }, { status: 201 });
}

export async function GET() {
  const locations = await prisma.location.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ locations });
}
