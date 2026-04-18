// src/app/api/bookings/[id]/documents/file/[filename]/route.ts
// Serves private document files with booking ownership verification.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/authz";
import { readFile } from "fs/promises";
import { join, extname, basename } from "path";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const { id, filename } = await params;

  // Security: prevent path traversal
  const safe = basename(filename);
  if (safe !== filename || filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const ext = extname(safe).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify booking ownership
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { userId: true, documentLicenseUrl: true, documentIdUrl: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = isAdminRole(session.user.role as string);
  if (!isAdmin && booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Verify this filename belongs to this booking (prevent accessing other bookings' files)
  const expectedPaths = [booking.documentLicenseUrl, booking.documentIdUrl].filter(Boolean);
  const requestedPath = `/api/bookings/${id}/documents/file/${filename}`;
  if (!expectedPaths.includes(requestedPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const filePath = join(process.cwd(), "private-uploads", "docs", safe);
    const data = await readFile(filePath);

    const contentTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
    };
    const contentType = contentTypes[ext] ?? "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safe}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
