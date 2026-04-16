// src/app/(admin)/admin/faq/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { FaqAdminClient } from "@/components/admin/faq-admin-client";

export default async function AdminFaqPage() {
  const items = await prisma.faqItem.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  return <FaqAdminClient items={items} />;
}
