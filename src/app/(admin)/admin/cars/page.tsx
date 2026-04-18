// src/app/(admin)/admin/cars/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, Eye, Car, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DeleteCarButton } from "@/components/admin/delete-car-button";
import { ToggleCarActiveButton } from "@/components/admin/toggle-car-active-button";

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function AdminCarsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = sp.q?.trim() ?? "";
  const statusFilter = sp.status === "inactive" ? false : sp.status === "active" ? true : undefined;

  const where = {
    ...(statusFilter !== undefined && { isActive: statusFilter }),
    ...(query && {
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { brand: { contains: query, mode: "insensitive" as const } },
        { model: { contains: query, mode: "insensitive" as const } },
        { licensePlate: { contains: query, mode: "insensitive" as const } },
      ],
    }),
  };

  const cars = await prisma.car.findMany({
    where,
    select: {
      id: true, name: true, brand: true, model: true, year: true,
      slug: true, transmission: true, pricePerDay: true,
      isActive: true, isFeatured: true, sortOrder: true,
      category: { select: { name: true } },
      images: { where: { isPrimary: true }, select: { url: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Fleet Management</h1>
          <p className="text-gray-500 text-sm mt-1">{cars.length} vehicles{query && ` matching "${query}"`}</p>
        </div>
        <Link href="/admin/cars/new" className="btn-primary text-sm px-4 py-2.5">
          <Plus className="h-4 w-4" /> Add Car
        </Link>
      </div>

      <form method="GET" className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name, brand, plate…"
            className="form-input pl-9 text-sm"
          />
        </div>
        <button type="submit" className="px-3 py-2 bg-navy-900 text-white rounded-lg text-sm hover:bg-navy-800">
          Search
        </button>
        {query && (
          <Link href="/admin/cars" className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
            Clear
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Vehicle", "Category", "Transmission", "Daily Rate", "Bookings", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cars.map((car) => (
                <tr key={car.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {(car.images as { url: string }[])[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={(car.images as { url: string }[])[0].url} alt={car.name} className="h-full w-full object-cover" />
                        ) : (
                          <Car className="h-5 w-5 text-gray-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-navy-900">{car.name}</p>
                        <p className="text-xs text-gray-400">{car.year} · {car.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-600">{car.category.name}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-600">{car.transmission}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-sm text-navy-900">{formatCurrency(car.pricePerDay)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-600">{car._count.bookings}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ToggleCarActiveButton carId={car.id} carName={car.name} isActive={car.isActive} />
                      <span className={`text-xs font-medium ${car.isActive ? "text-green-700" : "text-gray-400"}`}>
                        {car.isActive ? "Active" : "Inactive"}
                      </span>
                      {car.isFeatured && (
                        <span className="status-badge text-xs bg-crimson-50 text-crimson-600 border-crimson-200">Featured</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <Link href={`/fleet/${car.slug}`} target="_blank" className="p-1.5 rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100 transition-colors" title="View">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link href={`/admin/cars/${car.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100 transition-colors" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <DeleteCarButton carId={car.id} carName={car.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cars.length === 0 && (
          <div className="p-12 text-center">
            <Car className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-500">No cars in fleet yet</p>
            <Link href="/admin/cars/new" className="btn-primary text-sm px-5 py-2.5 mt-4 inline-flex">Add First Car</Link>
          </div>
        )}
      </div>
    </div>
  );
}
