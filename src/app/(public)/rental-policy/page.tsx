// src/app/(public)/rental-policy/page.tsx
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LegalPageContent } from "@/components/pages/legal-page-content";
import { getPublicSettings } from "@/lib/settings";
import { getServerLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "rental-policy" } });
  return {
    title: seo?.title ?? "Rental Policy — AutoKos",
    description:
      seo?.description ??
      "Read AutoKos car rental terms: driver requirements, fuel policy, mileage limits, deposit, cross-border rules, and cancellation conditions for Kosovo.",
    alternates: { canonical: "/rental-policy" },
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "Rental Policy — AutoKos",
      description: seo?.ogDescription ?? seo?.description ?? undefined,
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

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
