// src/app/(admin)/admin/bookings/page.tsx
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import Link from "next/link";
import { Eye, Calendar, Search, Plus } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor, getPaymentStatusColor } from "@/lib/utils";
import { BookingStatusFilter } from "@/components/admin/booking-status-filter";

interface Props {
  searchParams: Promise<{ status?: string; page?: string; search?: string }>;
}

export default async function AdminBookingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 20;
  const status = sp.status;
  const search = sp.search?.trim() ?? "";

  const validStatuses = Object.values(BookingStatus);
  const statusFilter = status && status !== "ALL" && validStatuses.includes(status as BookingStatus)
    ? { status: status as BookingStatus }
    : {};

  const searchFilter = search
    ? {
        OR: [
          { bookingRef: { contains: search, mode: "insensitive" as const } },
          { guestFirstName: { contains: search, mode: "insensitive" as const } },
          { guestLastName: { contains: search, mode: "insensitive" as const } },
          { guestEmail: { contains: search, mode: "insensitive" as const } },
          { guestPhone: { contains: search, mode: "insensitive" as const } },
          { car: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const where = { ...statusFilter, ...searchFilter };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        car: { select: { name: true, brand: true } },
        pickupLocation: { select: { name: true } },
        dropoffLocation: { select: { name: true } },
        user: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const statusCounts = await prisma.booking.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">
            {total} booking{total !== 1 ? "s" : ""}{search ? ` matching "${search}"` : ""}
          </p>
        </div>
        <Link href="/admin/bookings/new" className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2">
          <Plus className="h-4 w-4" />
          New Booking
        </Link>
      </div>

      {/* Search bar */}
      <form method="GET" className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search ref, customer, vehicle..."
            className="form-input pl-9 text-sm"
          />
          {status && <input type="hidden" name="status" value={status} />}
        </div>
        <button type="submit" className="btn-primary text-sm px-4 py-2">Search</button>
        {(search || status) && (
          <Link href="/admin/bookings" className="btn-secondary text-sm px-4 py-2">Clear</Link>
        )}
      </form>

      {/* Status filter tabs */}
      <Suspense fallback={null}>
        <BookingStatusFilter current={status} counts={statusCounts} total={await prisma.booking.count()} />
      </Suspense>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Reference", "Customer", "Vehicle", "Pickup", "Days", "Total", "Status", "Payment", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-semibold text-navy-900">{booking.bookingRef}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-navy-900">{booking.guestFirstName} {booking.guestLastName}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[140px]">{booking.guestEmail}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-gray-700">{booking.car.name}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-gray-700">{booking.pickupLocation.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(booking.pickupDateTime)}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-600">{booking.durationDays}d</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-sm text-navy-900">{formatCurrency(booking.totalAmount)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`status-badge text-xs ${getStatusColor(booking.status)}`}>{booking.status}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`status-badge text-xs ${getPaymentStatusColor(booking.paymentStatus)}`}>{booking.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100 transition-colors inline-flex"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bookings.length === 0 && (
          <div className="p-12 text-center">
            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-500">No bookings found</p>
            {search && <p className="text-gray-400 text-sm mt-1">Try a different search term</p>}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/bookings?page=${page - 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/bookings?page=${page + 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
