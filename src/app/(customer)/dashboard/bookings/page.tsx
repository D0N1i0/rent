// src/app/(customer)/dashboard/bookings/page.tsx
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate, getStatusColor, getPaymentStatusColor } from "@/lib/utils";
import { Calendar, Car, MapPin, ArrowRight, ChevronLeft } from "lucide-react";

export default async function CustomerBookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/bookings");

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      car: { include: { images: { where: { isPrimary: true } }, category: true } },
      pickupLocation: { select: { name: true } },
      dropoffLocation: { select: { name: true } },
      extras: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-8">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-900 mb-3 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-navy-900">My Bookings</h1>
          <p className="text-gray-500 mt-1">{bookings.length} booking{bookings.length !== 1 ? "s" : ""} total</p>
        </div>
      </div>

      <div className="page-container py-8">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="font-bold text-navy-900 mb-2">No bookings yet</h2>
            <p className="text-gray-500 text-sm mb-6">Ready to hit the road? Browse our fleet and make your first booking.</p>
            <Link href="/fleet" className="btn-primary text-sm px-6 py-2.5">Browse Cars</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`} className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                        <div>
                          <p className="font-bold text-navy-900">{booking.car.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 font-mono">{booking.bookingRef}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`status-badge ${getStatusColor(booking.status)}`}>{booking.status}</span>
                          <span className={`status-badge ${getPaymentStatusColor(booking.paymentStatus)}`}>{booking.paymentStatus}</span>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                          <span>{formatDate(booking.pickupDateTime)} → {formatDate(booking.dropoffDateTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="truncate">{booking.pickupLocation.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xl font-bold text-navy-900">{formatCurrency(booking.totalAmount)}</p>
                        <p className="text-xs text-gray-400">{booking.durationDays} day{booking.durationDays !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex items-center gap-1 text-crimson-500 text-sm font-medium">
                        Details <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
