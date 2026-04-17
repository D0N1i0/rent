// src/app/(public)/airport-rental/page.tsx
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { AirportRentalClient } from "@/components/pages/airport-rental-client";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "airport-rental" } });
  return {
    title: seo?.title ?? "Prishtina Airport Car Rental — Direct Arrivals Hall Pickup",
    description: seo?.description ?? "Rent a car directly from Prishtina Airport Adem Jashari. 24/7 meet & greet service. Pre-book online for instant confirmation.",
    keywords: seo?.keywords ?? undefined,
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "Prishtina Airport Car Rental — Direct Arrivals Hall Pickup",
      description: seo?.ogDescription ?? seo?.description ?? "Rent a car directly from Prishtina Airport Adem Jashari. 24/7 meet & greet service. Pre-book online for instant confirmation.",
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

export default async function AirportRentalPage() {
  const settings = await getPublicSettings();
  return <AirportRentalClient whatsappNumber={settings.whatsappNumber} />;
}
