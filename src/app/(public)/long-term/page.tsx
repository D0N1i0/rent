// src/app/(public)/long-term/page.tsx
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { LongTermClient } from "@/components/pages/long-term-client";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "long-term" } });
  return {
    title: seo?.title ?? "Monthly & Long-Term Car Rental Kosovo",
    description: seo?.description ?? "Long-term car rentals in Kosovo from 30 days. Unlimited mileage, flexible terms, corporate options available.",
    keywords: seo?.keywords ?? undefined,
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "Monthly & Long-Term Car Rental Kosovo",
      description: seo?.ogDescription ?? seo?.description ?? "Long-term car rentals in Kosovo from 30 days. Unlimited mileage, flexible terms, corporate options available.",
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

export default async function LongTermPage() {
  const settings = await getPublicSettings();
  return <LongTermClient whatsappNumber={settings.whatsappNumber} />;
}
