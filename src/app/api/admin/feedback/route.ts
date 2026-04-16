// src/app/api/admin/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isAdminRole, getSessionRole } from "@/lib/authz";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 25;

  const where: Record<string, unknown> = {};
  if (status && ["NEW", "IN_REVIEW", "RESOLVED", "DISMISSED"].includes(status)) {
    where.status = status;
  }
  if (type && ["COMPLAINT", "SUGGESTION", "FEATURE_REQUEST", "BUG_REPORT", "OTHER"].includes(type)) {
    where.type = type;
  }

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.feedback.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
}
