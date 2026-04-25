// src/app/(public)/fleet/page.tsx
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { FleetClient } from "@/components/cars/fleet-client";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "fleet" } });
  return {
    title: seo?.title ?? "Our Fleet — All Cars",
    description: seo?.description ?? "Browse our complete fleet of rental cars in Kosovo. Economy, SUV, sedan, premium and vans.",
    keywords: seo?.keywords ?? undefined,
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "Our Fleet — All Cars",
      description: seo?.ogDescription ?? seo?.description ?? "Browse our complete fleet of rental cars in Kosovo. Economy, SUV, sedan, premium and vans.",
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

async function getFleetData() {
  const [cars, categories, locations] = await Promise.all([
    prisma.car.findMany({
      where: { isActive: true },
      select: {
        id: true, slug: true, name: true, brand: true, model: true, year: true,
        seats: true, transmission: true, fuelType: true, hasAC: true,
        isFeatured: true, sortOrder: true,
        pricePerDay: true, pricePerWeek: true, pricePerMonth: true,
        mileageLimit: true,
        images: { where: { isPrimary: true }, select: { id: true, url: true, alt: true, isPrimary: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.carCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.location.findMany({ where: { isActive: true, isPickupPoint: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return { cars, categories, locations };
}

export default async function FleetPage() {
  const { cars, categories, locations } = await getFleetData();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" /></div>}>
      <FleetClient cars={cars as unknown as import("@/components/cars/car-card").CarCardData[]} categories={categories} locations={locations} />
    </Suspense>
  );
}
