// src/app/api/admin/media/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { unlink } from "fs/promises";
import path from "path";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) return null;
  return session;
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const file = await prisma.mediaFile.findUnique({ where: { id } });
    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

    // Delete physical file if it's a local upload
    if (file.url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", file.url);
      try {
        await unlink(filePath);
      } catch {
        // File may not exist on disk, continue
      }
    }

    await prisma.mediaFile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Media delete error:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
