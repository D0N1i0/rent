// src/app/(public)/terms/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LegalPageContent } from "@/components/pages/legal-page-content";
import { getPublicSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "terms" } });
  return {
    title: seo?.title ?? "Terms & Conditions — AutoKos",
    description: seo?.description ?? "Read the full rental terms and conditions for AutoKos car rentals in Kosovo.",
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "Terms & Conditions — AutoKos",
      description: seo?.ogDescription ?? seo?.description ?? undefined,
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

export default async function TermsPage() {
  const [page, settings] = await Promise.all([
    prisma.legalPage.findUnique({ where: { slug: "terms-and-conditions" } }),
    getPublicSettings(),
  ]);
  if (!page) notFound();
  return <LegalPageContent page={page} whatsappNumber={settings.whatsappNumber} supportEmail={settings.supportEmail} />;
}
