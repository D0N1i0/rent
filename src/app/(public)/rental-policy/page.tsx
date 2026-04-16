// src/app/(public)/rental-policy/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LegalPageContent } from "@/components/pages/legal-page-content";
import { getPublicSettings } from "@/lib/settings";

export default async function RentalPolicyPage() {
  const [page, settings] = await Promise.all([
    prisma.legalPage.findUnique({ where: { slug: "rental-policy" } }),
    getPublicSettings(),
  ]);
  if (!page) notFound();
  return <LegalPageContent page={page} whatsappNumber={settings.whatsappNumber} />;
}
