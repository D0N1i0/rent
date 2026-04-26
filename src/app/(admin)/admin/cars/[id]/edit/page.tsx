import { notFound } from "next/navigation";
import Link from "next/link";
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-navy-900">Edit Car: {car.name}</h1>
        <Link
          href={`/admin/cars/${id}/maintenance`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          🔧 Maintenance Logs
        </Link>
      </div>
      <CarAdminForm categories={categories} car={car} />
    </div>
  );
}
