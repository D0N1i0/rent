// src/app/(admin)/admin/extras/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { ExtrasAdminClient } from "@/components/admin/extras-admin-client";

export default async function AdminExtrasPage() {
  const extras = await prisma.extra.findMany({ orderBy: { sortOrder: "asc" } });
  return <ExtrasAdminClient extras={extras} />;
}
