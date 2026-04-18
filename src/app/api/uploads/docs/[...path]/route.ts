// src/app/api/uploads/docs/[...path]/route.ts
// Authenticated serving route for private booking documents (licence/ID scans).
// Files are stored in `private-uploads/docs/` (outside /public) and served
// through here only after verifying session ownership or admin role.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/authz";
import { readFile } from "fs/promises";
import { join, resolve, basename } from "path";

const PRIVATE_DOCS_DIR = join(process.cwd(), "private-uploads", "docs");

// Prevent path traversal: ensure the resolved path is inside PRIVATE_DOCS_DIR.
function safePath(filename: string): string | null {
  const resolved = resolve(PRIVATE_DOCS_DIR, basename(filename));
  if (!resolved.startsWith(PRIVATE_DOCS_DIR)) return null;
  return resolved;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only use the last segment (filename) — prevents traversal via the catch-all.
  const filename = path[path.length - 1];
  if (!filename) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = safePath(filename);
  if (!filePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = isAdminRole(session.user.role as string);

  if (!isAdmin) {
    // For non-admins: verify the file belongs to one of their bookings.
    const booking = await prisma.booking.findFirst({
      where: {
        userId: session.user.id,
        OR: [
          { documentLicenseUrl: { contains: filename } },
          { documentIdUrl: { contains: filename } },
        ],
      },
      select: { id: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  try {
    const buffer = await readFile(filePath);

    // Determine content type from extension
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "pdf"
        ? "application/pdf"
        : ext === "png"
        ? "image/png"
        : ext === "webp"
        ? "image/webp"
        : "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        // Force download for PDFs; inline for images (still requires session)
        "Content-Disposition": ext === "pdf" ? `attachment; filename="${filename}"` : "inline",
        // No browser caching — documents are sensitive
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
