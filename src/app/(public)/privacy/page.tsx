// src/app/(public)/privacy/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LegalPageContent } from "@/components/pages/legal-page-content";
import { getPublicSettings } from "@/lib/settings";
import { getServerLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "privacy" } });
  return {
    title: seo?.title ?? "Privacy Policy — AutoKos",
    description: seo?.description ?? "Learn how AutoKos handles your personal data and privacy when renting a car in Kosovo.",
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "Privacy Policy — AutoKos",
      description: seo?.ogDescription ?? seo?.description ?? undefined,
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const slug = locale === "al" ? "privacy-policy-al" : "privacy-policy";

  const [page, settings] = await Promise.all([
    prisma.legalPage.findUnique({ where: { slug } }),
    getPublicSettings(),
  ]);

  // Fall back to English if AL version doesn't exist yet
  const resolvedPage = page ?? (locale === "al" ? await prisma.legalPage.findUnique({ where: { slug: "privacy-policy" } }) : null);
  if (!resolvedPage) notFound();
  return <LegalPageContent page={resolvedPage} locale={locale} whatsappNumber={settings.whatsappNumber} supportEmail={settings.supportEmail} />;
}
