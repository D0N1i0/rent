// src/app/(public)/faq/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { FaqPageClient } from "@/components/pages/faq-page-client";
import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "faq" } });
  return {
    title: seo?.title ?? "FAQ — Frequently Asked Questions",
    description: seo?.description ?? "Find answers to the most common questions about renting a car with AutoKos in Kosovo.",
    keywords: seo?.keywords ?? undefined,
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "FAQ — Frequently Asked Questions",
      description: seo?.ogDescription ?? seo?.description ?? "Find answers to the most common questions about renting a car with AutoKos in Kosovo.",
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

export default async function FaqPage() {
  const items = await prisma.faqItem.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))] as string[];
  const settings = await getPublicSettings();

  return <FaqPageClient items={items} categories={categories} whatsappNumber={settings.whatsappNumber} />;
}
