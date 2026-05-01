// src/app/api/admin/faq/route.ts
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

const faqSchema = z.object({
  question: z.string().min(5).max(500),
  answer: z.string().min(10).max(5000),
  category: z.string().max(50).optional().default("general"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const body = await req.json();
  const parsed = faqSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const item = await prisma.faqItem.create({ data: parsed.data });
  return NextResponse.json({ item }, { status: 201 });
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ items });
}
