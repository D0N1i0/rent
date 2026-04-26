// src/app/api/admin/legal/[id]/route.ts
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

const schema = z.object({
  title: z.string().min(2).max(200).optional(),
  content: z.string().min(1).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const page = await prisma.legalPage.update({
    where: { id },
    data: parsed.data,
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "LEGAL_PAGE_UPDATED",
      entity: "LegalPage",
      entityId: page.id,
      details: { slug: page.slug },
    },
  });

  return NextResponse.json({ page });
}
