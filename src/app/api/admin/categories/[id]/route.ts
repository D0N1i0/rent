// src/app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid category data";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Generate slug, avoid collision with other categories
  let slug = slugify(parsed.data.name);
  const conflict = await prisma.carCategory.findFirst({
    where: { slug, id: { not: id } },
    select: { id: true },
  });
  if (conflict) slug = `${slug}-${Date.now()}`;

  const category = await prisma.carCategory.update({
    where: { id },
    data: {
      ...parsed.data,
      slug,
      description: parsed.data.description ?? null,
      iconUrl: parsed.data.iconUrl ?? null,
    },
  });
  revalidateTag("categories");
  return NextResponse.json({ category });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const linkedCars = await prisma.car.count({ where: { categoryId: id } });
  if (linkedCars > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${linkedCars} car${linkedCars > 1 ? "s" : ""} still use this category` },
      { status: 400 }
    );
  }

  await prisma.carCategory.delete({ where: { id } });
  revalidateTag("categories");
  return NextResponse.json({ ok: true });
}
