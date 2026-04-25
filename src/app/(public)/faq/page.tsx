// src/app/(public)/faq/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { FaqPageClient } from "@/components/pages/faq-page-client";
import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/settings";
import { getServerLocale } from "@/lib/i18n/server";

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
  const locale = await getServerLocale();

  // Query by language — falls back gracefully if the migration hasn't been applied yet
  let items = await prisma.faqItem
    .findMany({
      where: { isActive: true, language: locale },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    })
    .catch(() =>
      prisma.faqItem.findMany({
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      })
    );

  // Fall back to English if no items exist for the locale
  if (items.length === 0) {
    items = await prisma.faqItem
      .findMany({
        where: { isActive: true, language: "en" },
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      })
      .catch(() =>
        prisma.faqItem.findMany({
          where: { isActive: true },
          orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
        })
      );
  }

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))] as string[];
  const settings = await getPublicSettings();

  return <FaqPageClient items={items} categories={categories} whatsappNumber={settings.whatsappNumber} />;
}
