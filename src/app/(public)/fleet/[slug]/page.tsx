// src/app/(public)/fleet/[slug]/page.tsx
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CarDetailClient } from "@/components/cars/car-detail-client";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const car = await prisma.car.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!car) return { title: "Car Not Found" };
  return {
    title: car.metaTitle ?? `${car.name} — Rent in Kosovo`,
    description: car.metaDescription ?? car.shortDescription ?? `Rent the ${car.name} in Kosovo from €${car.pricePerDay}/day.`,
  };
}

export default async function CarDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const [car, extras, locations, relatedCars] = await Promise.all([
    prisma.car.findUnique({
      where: { slug, isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
      },
    }),
    prisma.extra.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }).catch(() => []),
    prisma.location.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }).catch(() => []),
    prisma.car.findMany({
      where: { isActive: true, slug: { not: slug } },
      include: { images: { where: { isPrimary: true } }, category: true },
      take: 3,
    }).catch(() => []),
  ]);

  if (!car) notFound();

  return (
    <CarDetailClient
      car={car}
      extras={extras}
      locations={locations}
      relatedCars={relatedCars}
      searchParams={sp}
    />
  );
}
