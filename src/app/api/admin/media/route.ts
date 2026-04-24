// src/app/api/admin/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { uploadImage, deleteCloudinaryFile } from "@/lib/cloudinary";
import { isValidImageType } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) return null;
  return session;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      if (!isValidImageType(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size is 5MB.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await uploadImage(buffer, { folder: "autokos/media" });

      const mediaFile = await prisma.mediaFile.create({
        data: {
          filename: file.name,
          url: result.secureUrl,
          mimeType: file.type,
          size: file.size,
          folder: "autokos/media",
          // Store Cloudinary public_id for potential future deletion
          alt: result.publicId,
        },
      });

      uploadedFiles.push(mediaFile);
    }

    return NextResponse.json({ files: uploadedFiles }, { status: 201 });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const files = await prisma.mediaFile.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ files });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const file = await prisma.mediaFile.findUnique({ where: { id } });
    if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Delete from Cloudinary — alt field holds the publicId
    if (file.alt && file.url.includes("cloudinary.com")) {
      await deleteCloudinaryFile(file.alt, "image").catch((err) =>
        console.error("[Media] Cloudinary delete failed:", err)
      );
    }

    await prisma.mediaFile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Media delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
