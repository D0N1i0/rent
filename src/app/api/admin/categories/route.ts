// src/app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { checkAdminRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { z } from "zod";

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) return null;
  return session;
}

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).nullable().optional(),
  iconUrl: z.string().url("Must be a valid URL").nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const categories = await prisma.carCategory.findMany({
    include: { _count: { select: { cars: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid category data";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Generate unique slug
  let slug = slugify(parsed.data.name);
  let i = 1;
  while (await prisma.carCategory.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${slugify(parsed.data.name)}-${i++}`;
  }

  const category = await prisma.carCategory.create({
    data: {
      ...parsed.data,
      slug,
      description: parsed.data.description ?? null,
      iconUrl: parsed.data.iconUrl ?? null,
    },
  });
  return NextResponse.json({ category }, { status: 201 });
}
