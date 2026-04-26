// src/app/api/admin/feedback/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isAdminRole, getSessionRole } from "@/lib/authz";
import { checkAdminRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) return null;
  return session;
}

const patchSchema = z.object({
  status: z.enum(["NEW", "IN_REVIEW", "RESOLVED", "DISMISSED"]).optional(),
  adminNotes: z.string().max(2000).optional().or(z.literal("")),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) {
      updateData.status = parsed.data.status;
      if (parsed.data.status === "RESOLVED") updateData.resolvedAt = new Date();
      if (parsed.data.status !== "RESOLVED") updateData.resolvedAt = null;
    }
    if ("adminNotes" in parsed.data) {
      updateData.adminNotes = parsed.data.adminNotes?.trim() || null;
    }

    const feedback = await prisma.feedback.update({ where: { id }, data: updateData });
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Feedback update error:", error);
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  try {
    await prisma.feedback.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback delete error:", error);
    return NextResponse.json({ error: "Failed to delete feedback" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const rl = await checkAdminRateLimit(req, session.user.id, "write");
  if (rl) return NextResponse.json(rl.body, { status: rl.status });

  const feedback = await prisma.feedback.findUnique({
    where: { id },
    include: { user: { select: { email: true, firstName: true, lastName: true } } },
  });

  if (!feedback) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ feedback });
}
