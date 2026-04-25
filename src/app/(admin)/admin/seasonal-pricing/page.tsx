// src/app/(admin)/admin/seasonal-pricing/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { SeasonalPricingAdminClient } from "@/components/admin/seasonal-pricing-admin-client";

export default async function AdminSeasonalPricingPage() {
  const [items, cars] = await Promise.all([
    prisma.seasonalPricing.findMany({
      include: { car: { select: { name: true, brand: true } } },
      orderBy: [{ carId: "asc" }, { startDate: "asc" }],
    }),
    prisma.car.findMany({
      where: { isActive: true },
      select: { id: true, name: true, brand: true },
      orderBy: [{ brand: "asc" }, { name: "asc" }],
    }),
  ]);

  return <SeasonalPricingAdminClient items={items as unknown as { id: string; carId: string; car: { name: string }; name: string; startDate: string | Date; endDate: string | Date; pricePerDay: number; pricePerWeek: number | null; isActive: boolean }[]} cars={cars} />;
}
