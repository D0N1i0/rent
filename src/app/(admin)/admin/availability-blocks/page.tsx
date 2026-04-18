// src/app/(admin)/admin/availability-blocks/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { AvailabilityBlocksAdminClient } from "@/components/admin/availability-blocks-admin-client";

const PAGE_SIZE = 30;

interface Props {
  searchParams: Promise<{ page?: string; carId?: string }>;
}

export default async function AdminAvailabilityBlocksPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const carFilter = sp.carId ? { carId: sp.carId } : {};

  const [items, total, cars] = await Promise.all([
    prisma.availabilityBlock.findMany({
      where: carFilter,
      include: { car: { select: { name: true, brand: true } } },
      orderBy: { startDate: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.availabilityBlock.count({ where: carFilter }),
    prisma.car.findMany({
      where: { isActive: true },
      select: { id: true, name: true, brand: true },
      orderBy: [{ brand: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <AvailabilityBlocksAdminClient
      items={items}
      cars={cars}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
    />
  );
}
