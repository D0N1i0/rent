// src/app/(admin)/admin/availability-blocks/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { AvailabilityBlocksAdminClient } from "@/components/admin/availability-blocks-admin-client";

export default async function AdminAvailabilityBlocksPage() {
  const [items, cars] = await Promise.all([
    prisma.availabilityBlock.findMany({
      include: { car: { select: { name: true, brand: true } } },
      orderBy: { startDate: "desc" },
    }),
    prisma.car.findMany({
      where: { isActive: true },
      select: { id: true, name: true, brand: true },
      orderBy: [{ brand: "asc" }, { name: "asc" }],
    }),
  ]);

  return <AvailabilityBlocksAdminClient items={items} cars={cars} />;
}
