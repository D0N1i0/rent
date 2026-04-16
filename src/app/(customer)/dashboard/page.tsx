// src/app/(customer)/dashboard/page.tsx
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Car, Calendar, ArrowRight, Clock, CheckCircle, Lock, User, AlertCircle, Home } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { getPublicSettings } from "@/lib/settings";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, email: true, phone: true, licenseNumber: true },
  });

  const [bookings, statusCounts] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: session.user.id },
      include: {
        car: { select: { name: true, brand: true } },
        pickupLocation: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    Promise.all([
      prisma.booking.count({ where: { userId: session.user.id } }),
      prisma.booking.count({ where: { userId: session.user.id, status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } } }),
      prisma.booking.count({ where: { userId: session.user.id, status: "COMPLETED" } }),
      prisma.booking.count({ where: { userId: session.user.id, status: "PENDING" } }),
      prisma.booking.count({ where: { userId: session.user.id, status: { in: ["CONFIRMED", "IN_PROGRESS"] } } }),
    ]),
  ]);

  const [total, active, completed, pendingCount, confirmedCount] = statusCounts;
  const profileComplete = !!(user?.phone && user?.licenseNumber);
  const settings = await getPublicSettings();

  const quickLinks = [
    { href: "/fleet", label: "Book a New Car", icon: Car, primary: true },
    { href: "/dashboard/bookings", label: "My Bookings", icon: Calendar },
    { href: "/dashboard/profile", label: "Edit Profile", icon: User },
    { href: "/dashboard/security", label: "Security", icon: Lock },
  ];

  return (
    <div>
      {/* Hero header */}
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-gray-400 flex items-center gap-1.5 mb-1">
                <Home className="h-3.5 w-3.5" />
                <Link href="/" className="hover:text-crimson-500 transition-colors">Back to site</Link>
              </p>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-navy-900">
                Welcome back, {user?.firstName ?? "there"}!
              </h1>
              <p className="text-gray-500 mt-1">Manage your bookings and account details</p>
            </div>
            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:text-navy-900 transition-colors font-medium"
            >
              <Home className="h-4 w-4" />
              Back to Site
            </Link>
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Profile incomplete banner */}
        {!profileComplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Complete your profile</p>
                <p className="text-amber-700 text-xs mt-0.5">Add your phone and driving licence number to speed up future bookings.</p>
              </div>
            </div>
            <Link href="/dashboard/profile" className="btn-primary text-sm px-4 py-2 shrink-0">Complete Profile</Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Bookings", value: total, icon: Calendar, color: "bg-blue-50 text-blue-600" },
            { label: "Active Rentals", value: active, icon: Car, color: "bg-green-50 text-green-600" },
            { label: "Completed", value: completed, icon: CheckCircle, color: "bg-purple-50 text-purple-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Status breakdown (only shown when there are bookings) */}
        {total > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Pending", count: pendingCount, color: "bg-yellow-50 text-yellow-700 border-yellow-200", href: "/dashboard/bookings?status=PENDING" },
              { label: "Active / Confirmed", count: confirmedCount, color: "bg-blue-50 text-blue-700 border-blue-200", href: "/dashboard/bookings?status=CONFIRMED" },
              { label: "Completed", count: completed, color: "bg-green-50 text-green-700 border-green-200", href: "/dashboard/bookings?status=COMPLETED" },
            ].map(({ label, count, color, href }) => (
              <Link key={label} href={href} className={`rounded-xl border p-3 text-center ${color} hover:opacity-80 transition-opacity`}>
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs font-medium mt-0.5">{label}</p>
              </Link>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-navy-900">Recent Bookings</h2>
                <Link href="/dashboard/bookings" className="text-sm text-crimson-500 hover:underline font-medium flex items-center gap-1">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {bookings.length === 0 ? (
                <div className="p-8 text-center">
                  <Car className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No bookings yet</p>
                  <p className="text-sm text-gray-400 mb-4">Ready to explore Kosovo?</p>
                  <Link href="/fleet" className="btn-primary text-sm px-5 py-2.5">Browse Cars</Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {bookings.map((booking) => (
                    <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`} className="block p-5 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-navy-900 text-sm truncate">{booking.car.name}</p>
                            <span className={`status-badge text-xs ${getStatusColor(booking.status)}`}>{booking.status}</span>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(booking.pickupDateTime)} · {booking.pickupLocation.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">{booking.bookingRef}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-navy-900 text-sm">{formatCurrency(booking.totalAmount)}</p>
                          <p className="text-xs text-gray-400">{booking.durationDays}d</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Browse Cars CTA — shown when has bookings too */}
            <div className="mt-4 bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="text-white">
                <p className="font-bold">Ready for your next adventure?</p>
                <p className="text-sm text-gray-300 mt-0.5">Browse our full fleet and book your next car.</p>
              </div>
              <Link href="/fleet" className="shrink-0 flex items-center gap-2 bg-crimson-500 hover:bg-crimson-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                <Car className="h-4 w-4" />
                Browse Cars
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-navy-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {quickLinks.map(({ href, label, icon: Icon, primary }) => (
                  <Link key={href} href={href} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors ${primary ? "bg-navy-900 text-white hover:bg-navy-800" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                  </Link>
                ))}
              </div>
            </div>
            <div className="bg-navy-900 rounded-2xl p-5 text-white">
              <p className="font-bold mb-1">Need Help?</p>
              <p className="text-sm text-gray-300 mb-3">We&apos;re available 24/7 by phone and WhatsApp</p>
              <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                WhatsApp Chat
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
