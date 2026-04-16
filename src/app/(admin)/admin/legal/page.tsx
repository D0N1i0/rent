// src/app/(admin)/admin/legal/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { LegalAdminClient } from "@/components/admin/legal-admin-client";

export default async function AdminLegalPage() {
  const pages = await prisma.legalPage.findMany({ orderBy: { slug: "asc" } });
  return <LegalAdminClient pages={pages} />;
}
