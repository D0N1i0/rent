import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { CarAdminForm } from "@/components/admin/car-admin-form";

export default async function EditCarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, car] = await Promise.all([
    prisma.carCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.car.findUnique({
      where: { id },
      include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
    }),
  ]);

  if (!car) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Edit Car</h1>
      <CarAdminForm categories={categories} car={car} />
    </div>
  );
}
