// src/app/(admin)/admin/cars/new/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { CarAdminForm } from "@/components/admin/car-admin-form";

export default async function NewCarPage() {
  const categories = await prisma.carCategory.findMany({
    where: { isActive: true }, orderBy: { sortOrder: "asc" }
  });
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Add New Car</h1>
      <CarAdminForm categories={categories} />
    </div>
  );
}
