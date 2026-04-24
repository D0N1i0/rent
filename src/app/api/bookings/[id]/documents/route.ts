// src/app/api/bookings/[id]/documents/route.ts
// Secure document upload (driving licence / ID) for a booking.
// Files are stored in Cloudinary with unguessable public IDs.
// Access to the Cloudinary URLs is only returned through this authenticated route.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/authz";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { uploadDocument } from "@/lib/cloudinary";
import { randomBytes } from "crypto";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

function safePublicId(bookingRef: string, prefix: string): string {
  // 192 bits of entropy — effectively unguessable
  const random = randomBytes(24).toString("hex");
  return `${prefix}-${bookingRef}-${random}`;
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

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, userId: true, bookingRef: true },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const isAdmin = isAdminRole(session.user.role as string);
  if (!isAdmin && booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const licenseFile = formData.get("license") as File | null;
    const idFile = formData.get("identity") as File | null;

    if (!licenseFile && !idFile) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const updates: { documentLicenseUrl?: string; documentIdUrl?: string } = {};

    async function processFile(file: File, prefix: string): Promise<string> {
      if (!ALLOWED_TYPES.has(file.type)) {
        throw new Error(`File type not allowed: ${file.type}. Allowed: JPG, PNG, WEBP, PDF`);
      }
      if (file.size > MAX_SIZE_BYTES) {
        throw new Error(`File too large (max 8 MB)`);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const publicId = safePublicId(booking!.bookingRef, prefix);
      const result = await uploadDocument(buffer, { publicId, mimeType: file.type });
      // Store the Cloudinary secure URL — access is gated by this API route's auth check
      return result.secureUrl;
    }

    if (licenseFile) {
      updates.documentLicenseUrl = await processFile(licenseFile, "lic");
    }
    if (idFile) {
      updates.documentIdUrl = await processFile(idFile, "id");
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
