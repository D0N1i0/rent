// src/app/(admin)/admin/availability-calendar/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { AvailabilityCalendarClient } from "@/components/admin/availability-calendar-client";

export default async function AdminAvailabilityCalendarPage() {
  const [categories, cars] = await Promise.all([
    prisma.carCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.car.findMany({
      where: { isActive: true },
      select: { id: true, name: true, brand: true },
      orderBy: [{ brand: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <AvailabilityCalendarClient
      categories={categories}
      allCars={cars}
    />
  );
}
