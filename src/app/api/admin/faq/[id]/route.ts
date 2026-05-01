// src/app/api/admin/faq/[id]/route.ts
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

const updateSchema = z.object({
  question: z.string().min(5).max(500).optional(),
  answer: z.string().min(10).max(5000).optional(),
  category: z.string().max(50).optional(),
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
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const item = await prisma.faqItem.update({ where: { id }, data: parsed.data });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "FAQ_UPDATED",
      entity: "FaqItem",
      entityId: item.id,
      ipAddress: getClientIp(req),
      details: { question: item.question.slice(0, 100), isActive: item.isActive },
    },
  });

  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const item = await prisma.faqItem.findUnique({ where: { id }, select: { question: true } });
  await prisma.faqItem.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "FAQ_DELETED",
      entity: "FaqItem",
      entityId: id,
      ipAddress: getClientIp(req),
      details: { question: item?.question.slice(0, 100) },
    },
  });

  return NextResponse.json({ success: true });
}
