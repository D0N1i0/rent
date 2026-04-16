// src/app/(admin)/admin/media/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { MediaAdminClient } from "@/components/admin/media-admin-client";

export default async function AdminMediaPage() {
  const files = await prisma.mediaFile.findMany({ orderBy: { createdAt: "desc" } });
  return <MediaAdminClient files={files} />;
}
