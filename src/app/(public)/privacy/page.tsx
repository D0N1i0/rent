// src/app/(public)/privacy/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LegalPageContent } from "@/components/pages/legal-page-content";
import { getPublicSettings } from "@/lib/settings";

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
  const [page, settings] = await Promise.all([
    prisma.legalPage.findUnique({ where: { slug: "privacy-policy" } }),
    getPublicSettings(),
  ]);
  if (!page) notFound();
  return <LegalPageContent page={page} whatsappNumber={settings.whatsappNumber} supportEmail={settings.supportEmail} />;
}
