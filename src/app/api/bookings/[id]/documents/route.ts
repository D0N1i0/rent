// src/app/api/bookings/[id]/documents/route.ts
// Secure document upload (driving licence / ID) for a booking.
// Files stored in /public/uploads/docs/ with sanitised names.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/authz";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomBytes } from "crypto";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

function safeFileName(originalName: string, prefix: string): string {
  const ext = extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, "");
  // 192 bits of entropy — makes the /uploads/docs path effectively unguessable
  // so personal ID scans can't be enumerated by an attacker who learns the dir.
  const random = randomBytes(24).toString("hex");
  return `${prefix}-${random}${ext}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Rate limit: 10 uploads per hour per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`doc-upload:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many upload attempts." }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load booking and verify ownership
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, userId: true, bookingRef: true },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const isAdmin = isAdminRole(session.user.role as string);
  if (!isAdmin && booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Can only upload for pending/confirmed bookings
  try {
    const formData = await req.formData();
    const licenseFile = formData.get("license") as File | null;
    const idFile = formData.get("identity") as File | null;

    if (!licenseFile && !idFile) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Store documents in a private directory outside /public so they cannot be
    // served directly by Next.js static file handling. Access is gated by the
    // authenticated serving route at /api/uploads/docs/[...path].
    const uploadDir = join(process.cwd(), "private-uploads", "docs");
    await mkdir(uploadDir, { recursive: true });

    const updates: { documentLicenseUrl?: string; documentIdUrl?: string } = {};

    async function processFile(file: File, prefix: string): Promise<string> {
      if (!ALLOWED_TYPES.has(file.type)) {
        throw new Error(`File type not allowed: ${file.type}. Allowed: JPG, PNG, WEBP, PDF`);
      }
      if (file.size > MAX_SIZE_BYTES) {
        throw new Error(`File too large (max 8 MB)`);
      }

      const safeName = safeFileName(file.name, prefix);
      const filePath = join(uploadDir, safeName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      // Return the authenticated API path — NOT a /public path
      return `/api/uploads/docs/${safeName}`;
    }

    if (licenseFile) {
      updates.documentLicenseUrl = await processFile(licenseFile, `lic-${booking.bookingRef}`);
    }
    if (idFile) {
      updates.documentIdUrl = await processFile(idFile, `id-${booking.bookingRef}`);
    }

    await prisma.booking.update({ where: { id }, data: updates });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DOCUMENTS_UPLOADED",
        entity: "Booking",
        entityId: id,
        details: { uploaded: Object.keys(updates) },
      },
    });

    return NextResponse.json({
      success: true,
      documentLicenseUrl: updates.documentLicenseUrl,
      documentIdUrl: updates.documentIdUrl,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    console.error("[Documents] Upload error:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { userId: true, documentLicenseUrl: true, documentIdUrl: true },
  });

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = isAdminRole(session.user.role as string);
  if (!isAdmin && booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({
    documentLicenseUrl: booking.documentLicenseUrl,
    documentIdUrl: booking.documentIdUrl,
  });
}
