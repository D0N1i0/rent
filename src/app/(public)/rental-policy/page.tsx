// src/app/(public)/rental-policy/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LegalPageContent } from "@/components/pages/legal-page-content";
import { getPublicSettings } from "@/lib/settings";
import { getServerLocale } from "@/lib/i18n/server";

export default async function RentalPolicyPage() {
  const locale = await getServerLocale();
  const slug = locale === "al" ? "rental-policy-al" : "rental-policy";

  const [page, settings] = await Promise.all([
    prisma.legalPage.findUnique({ where: { slug } }),
    getPublicSettings(),
  ]);

  const resolvedPage = page ?? (locale === "al" ? await prisma.legalPage.findUnique({ where: { slug: "rental-policy" } }) : null);
  if (!resolvedPage) notFound();
  return <LegalPageContent page={resolvedPage} locale={locale} whatsappNumber={settings.whatsappNumber} supportEmail={settings.supportEmail} />;
}
