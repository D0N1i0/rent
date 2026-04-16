// src/app/api/admin/seo/[page]/route.ts
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
  title: z.string().max(60).optional().or(z.literal("")),
  description: z.string().max(160).optional().or(z.literal("")),
  keywords: z.string().max(500).optional().or(z.literal("")),
  ogTitle: z.string().max(60).optional().or(z.literal("")),
  ogDescription: z.string().max(160).optional().or(z.literal("")),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const seo = await prisma.seoMetadata.upsert({
    where: { page },
    create: { page, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ seo });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const seo = await prisma.seoMetadata.findUnique({ where: { page } });
  return NextResponse.json({ seo });
}
