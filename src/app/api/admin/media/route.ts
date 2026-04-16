// src/app/api/admin/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
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

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const uploadedFiles = [];

    for (const file of files) {
      // Validate file type
      if (!isValidImageType(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size is 5MB.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
      const timestamp = Date.now();
      const filename = `${timestamp}_${safeName}`;
      const filePath = path.join(uploadDir, filename);
      const publicUrl = `/uploads/${filename}`;

      await writeFile(filePath, buffer);

      const mediaFile = await prisma.mediaFile.create({
        data: {
          filename: file.name,
          url: publicUrl,
          mimeType: file.type,
          size: file.size,
          folder: "uploads",
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
