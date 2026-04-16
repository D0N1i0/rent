// src/app/api/admin/contact-submissions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) return null;
  return session;
}

const patchSchema = z.object({
  isRead: z.boolean().optional(),
  repliedAt: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const submission = await prisma.contactSubmission.update({
    where: { id },
    data: {
      isRead: parsed.data.isRead,
      repliedAt:
        parsed.data.repliedAt !== undefined
          ? parsed.data.repliedAt
            ? new Date(parsed.data.repliedAt)
            : null
          : undefined,
    },
  });
  return NextResponse.json({ submission });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await prisma.contactSubmission.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
